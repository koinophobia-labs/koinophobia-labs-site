// Loaded only by the isolated browser acceptance process, never by the app.
globalThis.fetch = async () => { throw Error("Outbound fetch disabled in isolated password acceptance"); };
