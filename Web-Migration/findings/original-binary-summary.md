# Original Binary Extraction Plan

- Sector size: 2048
- Parsed maps: 121
- Resource entries: 1454
- Entries with next-sector span: 1333
- Entries that fit observed sector span: 1333
- Entries too large for observed span: 0

## Rationale

GaneshaDX source confirms GNS row offset 8 is FileSector. The split sidecar files are concatenated 2048-byte user-data sectors. For the provided MODE2/2352 BIN/CUE, raw BIN reads use fileSector * 2352 + 24 for each sector payload.

## Source Evidence

- `Resources/ResourceContent/MapResource.cs:126-128` confirms GNS row offset 8 is decoded as little-endian `FileSector`.
- `Resources/MapData.cs:101` confirms resources are sorted by `FileSector` before sidecar assignment.
- `Resources/MapData.cs:114-150` confirms numbered sidecars are assigned positionally after sorting.
- `Resources/ResourceContent/TextureResourceData.cs:15-52` confirms texture resource payload is a 256x1024 4-bit texture, i.e. 131072 bytes.
- The provided CUE declares `TRACK 01 MODE2/2352`; the user-data payload for each raw sector begins at byte 24 and is 2048 bytes.

## Use

For the split sidecar stream, each resource starts at logical `byteOffset = fileSector * 2048`.

For the provided raw BIN image, extract each resource by reading `minimumSectorSpanFromSidecar` sectors. For sector `n`, read 2048 bytes from raw BIN offset `(fileSector + n) * 2352 + 24`, concatenate those payloads, then compare the first `sidecarByteLength` bytes to the split sidecar file.

