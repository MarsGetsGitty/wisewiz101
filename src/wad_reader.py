"""
KIWAD Archive Reader
====================
Reads Wizard101's proprietary KIWAD (.wad) archive format.

Binary format (reverse-engineered from Root.wad):
    Header:
        5 bytes  - Magic ("KIWAD")
        4 bytes  - Version (int32 LE)
        4 bytes  - File count (int32 LE)
        1 byte   - Spacer (version >= 2 only)

    Per-file entry (repeated file_count times):
        4 bytes  - Data offset (int32 LE)
        4 bytes  - Uncompressed size (int32 LE)
        4 bytes  - Compressed size (int32 LE)
        1 byte   - Is compressed (0 or 1)
        4 bytes  - CRC32 checksum (int32 LE)
        4 bytes  - Filename length (int32 LE)
        N bytes  - Filename (null-terminated ASCII)

    Data section:
        File data at the offsets specified above.
        Compressed files use zlib (standard deflate with 2-byte header).
"""

import fnmatch
import os
import re
import struct
import zlib
from dataclasses import dataclass

KIWAD_MAGIC = b"KIWAD"

# File entry struct: offset(i) + uncomp_size(i) + comp_size(i) + is_compressed(B) + crc(I)
# Followed by name_len(i) + name(variable)
FILE_ENTRY_PREFIX = struct.Struct("<iiiBIi")


@dataclass
class WadFileEntry:
    """Represents a single file entry in a KIWAD archive."""
    name: str
    offset: int
    uncompressed_size: int
    compressed_size: int
    is_compressed: bool
    crc: int
    index: int  # Position in file table

    @property
    def data_size(self) -> int:
        """Actual size of data stored in the archive."""
        return self.compressed_size if self.is_compressed else self.uncompressed_size


class WadArchive:
    """
    Reader for KIWAD .wad archive files.

    Usage:
        wad = WadArchive("path/to/Root.wad")
        print(f"Contains {len(wad.files)} files")

        # List gear files
        gear_files = wad.list_files("ObjectData/*/Hats/*.xml")

        # Extract a single file
        data = wad.extract_file("ObjectData/Aquila Gear/Amulets/Amulet-AQ-Balance-Mastery.xml")

        # Extract many files to disk
        wad.extract_to_disk("ObjectData/*/Hats/*.xml", output_dir="extracted/")
    """

    def __init__(self, path: str):
        self.path = os.path.abspath(path)
        self._file_size = os.path.getsize(self.path)
        self.version: int = 0
        self.files: list[WadFileEntry] = []
        self._file_map: dict[str, WadFileEntry] = {}
        self._read_file_table()

    def _read_file_table(self) -> None:
        """Parse the KIWAD header and file table into memory."""
        with open(self.path, "rb") as f:
            # --- Header ---
            magic = f.read(5)
            if magic != KIWAD_MAGIC:
                raise ValueError(
                    f"Not a KIWAD file: expected magic {KIWAD_MAGIC!r}, "
                    f"got {magic!r}"
                )

            self.version = struct.unpack("<i", f.read(4))[0]
            file_count = struct.unpack("<i", f.read(4))[0]

            # Version 2+ has a spacer byte after the header
            if self.version >= 2:
                f.read(1)

            # --- File Table ---
            for i in range(file_count):
                prefix_data = f.read(FILE_ENTRY_PREFIX.size)
                if len(prefix_data) < FILE_ENTRY_PREFIX.size:
                    raise ValueError(
                        f"Truncated file table at entry {i}/{file_count}: "
                        f"expected {FILE_ENTRY_PREFIX.size} bytes, got {len(prefix_data)}"
                    )

                offset, uncomp_size, comp_size, is_comp, crc, name_len = \
                    FILE_ENTRY_PREFIX.unpack(prefix_data)

                name_bytes = f.read(name_len)
                if len(name_bytes) < name_len:
                    raise ValueError(
                        f"Truncated filename at entry {i}/{file_count}"
                    )

                # Strip null terminator
                name = name_bytes.rstrip(b"\x00").decode("ascii", errors="replace")

                entry = WadFileEntry(
                    name=name,
                    offset=offset,
                    uncompressed_size=uncomp_size,
                    compressed_size=comp_size,
                    is_compressed=bool(is_comp),
                    crc=crc,
                    index=i,
                )
                self.files.append(entry)
                self._file_map[name] = entry

    def get_entry(self, name: str) -> WadFileEntry | None:
        """Look up a file entry by exact name. Returns None if not found."""
        return self._file_map.get(name)

    def list_files(self, pattern: str | None = None) -> list[WadFileEntry]:
        """
        List files in the archive, optionally filtered by glob pattern.

        Supports * and ** wildcards via fnmatch:
            "ObjectData/*/Hats/*.xml"  - hats from any world
            "*.xml"                    - all XML files
            "Locale/*"                 - all locale files

        For regex filtering, use list_files_regex() instead.
        """
        if pattern is None:
            return list(self.files)

        return [
            entry for entry in self.files
            if fnmatch.fnmatch(entry.name, pattern)
        ]

    def list_files_regex(self, pattern: str, flags: int = 0) -> list[WadFileEntry]:
        """List files matching a regex pattern against filenames."""
        compiled = re.compile(pattern, flags)
        return [
            entry for entry in self.files
            if compiled.search(entry.name)
        ]

    def is_available(self, entry: WadFileEntry) -> bool:
        """
        Check if a file's data is actually present in the local WAD.

        Wizard101 streams content on-demand, so the file table may reference
        data offsets beyond the current file size (not-yet-downloaded content).
        """
        return (entry.offset + entry.data_size) <= self._file_size

    def extract_file(self, name: str) -> bytes:
        """
        Extract a single file by name, returning its decompressed contents.

        Raises:
            KeyError: if the file name doesn't exist in the archive
            IOError: if the file data hasn't been downloaded yet (streaming gap)
            ValueError: if decompression fails
        """
        entry = self._file_map.get(name)
        if entry is None:
            raise KeyError(f"File not found in archive: {name!r}")

        return self._extract_entry(entry)

    def _extract_entry(self, entry: WadFileEntry) -> bytes:
        """Extract and decompress a single file entry."""
        if not self.is_available(entry):
            raise OSError(
                f"File data not available (streaming gap): {entry.name!r} "
                f"at offset {entry.offset}, needs {entry.data_size} bytes, "
                f"but WAD file is only {self._file_size} bytes"
            )

        with open(self.path, "rb") as f:
            f.seek(entry.offset)
            raw_data = f.read(entry.data_size)

            if len(raw_data) < entry.data_size:
                raise OSError(
                    f"Could not read full data for {entry.name!r}: "
                    f"expected {entry.data_size} bytes, got {len(raw_data)}"
                )

        if entry.is_compressed:
            try:
                return zlib.decompress(raw_data)
            except zlib.error as e:
                raise ValueError(
                    f"Decompression failed for {entry.name!r}: {e}"
                ) from e
        else:
            return raw_data

    def extract_to_disk(
        self,
        pattern: str,
        output_dir: str,
        skip_unavailable: bool = True,
    ) -> dict:
        """
        Extract files matching a glob pattern to disk.

        Args:
            pattern: Glob pattern to match filenames
            output_dir: Directory to write extracted files to
            skip_unavailable: If True, silently skip files not yet downloaded

        Returns:
            dict with keys: 'extracted', 'skipped', 'errors'
                - extracted: list of successfully extracted file names
                - skipped: list of file names skipped (not available locally)
                - errors: list of (name, error_message) tuples
        """
        entries = self.list_files(pattern)
        result: dict[str, list] = {"extracted": [], "skipped": [], "errors": []}

        for entry in entries:
            if not self.is_available(entry):
                if skip_unavailable:
                    result["skipped"].append(entry.name)
                    continue
                else:
                    result["errors"].append(
                        (entry.name, "Data not available (streaming gap)")
                    )
                    continue

            out_path = os.path.join(output_dir, entry.name.replace("/", os.sep))
            os.makedirs(os.path.dirname(out_path), exist_ok=True)

            try:
                data = self._extract_entry(entry)
                with open(out_path, "wb") as f:
                    f.write(data)
                result["extracted"].append(entry.name)
            except Exception as e:
                result["errors"].append((entry.name, str(e)))

        return result

    def stats(self) -> dict:
        """
        Get summary statistics about the archive.

        Returns dict with: total_files, available_files, unavailable_files,
        compressed_files, total_uncompressed_size, total_compressed_size
        """
        available = sum(1 for e in self.files if self.is_available(e))
        compressed = sum(1 for e in self.files if e.is_compressed)
        total_uncomp = sum(e.uncompressed_size for e in self.files)
        total_comp = sum(e.compressed_size for e in self.files if e.is_compressed)

        return {
            "wad_path": self.path,
            "wad_version": self.version,
            "wad_file_size_mb": round(self._file_size / (1024 * 1024), 2),
            "total_files": len(self.files),
            "available_files": available,
            "unavailable_files": len(self.files) - available,
            "compressed_files": compressed,
            "total_uncompressed_size_mb": round(total_uncomp / (1024 * 1024), 2),
            "total_compressed_size_mb": round(total_comp / (1024 * 1024), 2),
        }

    def __repr__(self) -> str:
        return (
            f"WadArchive({self.path!r}, "
            f"version={self.version}, "
            f"files={len(self.files)})"
        )


# --- CLI for quick testing ---
if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        # Default: read the local Wizard101 Root.wad
        wad_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "..", "Wizard101", "Data", "GameData", "Root.wad"
        )
    else:
        wad_path = sys.argv[1]

    print(f"Opening: {wad_path}")
    wad = WadArchive(wad_path)

    # Print stats
    s = wad.stats()
    print(f"\n{'='*50}")
    print(f"  KIWAD Archive: {os.path.basename(wad_path)}")
    print(f"  Version:       {s['wad_version']}")
    print(f"  File size:     {s['wad_file_size_mb']} MB")
    print(f"  Total files:   {s['total_files']:,}")
    print(f"  Available:     {s['available_files']:,}")
    print(f"  Unavailable:   {s['unavailable_files']:,}")
    print(f"  Compressed:    {s['compressed_files']:,}")
    print(f"{'='*50}")

    # List optional pattern
    if len(sys.argv) >= 3:
        pattern = sys.argv[2]
        matches = wad.list_files(pattern)
        print(f"\nFiles matching '{pattern}': {len(matches)}")
        for entry in matches[:25]:
            avail = "✓" if wad.is_available(entry) else "✗"
            print(f"  [{avail}] {entry.name} ({entry.uncompressed_size:,} bytes)")
        if len(matches) > 25:
            print(f"  ... and {len(matches) - 25} more")
