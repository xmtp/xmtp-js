import init, {
  metadataFieldName as wasmMetadataFieldName,
  type MetadataField,
} from "@xmtp/wasm-bindings";

/**
 * Gets the name of a metadata field
 *
 * @param field - The metadata field to get the name for
 * @returns The name of the metadata field
 */
export const metadataFieldName = async (field: MetadataField) => {
  await init();
  return wasmMetadataFieldName(field);
};
