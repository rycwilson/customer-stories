declare global {
  interface Window {
    DataTable: object;
  }

  // Augment the globalThis interface
  var DataTable: object;
}