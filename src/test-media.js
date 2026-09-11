async function test() {
  const url = "http://127.0.0.1:8787/api/media/uploads/editor/tiptap/inline-1789155933538.png";
  try {
    const res = await fetch(url);
    console.log("Status:", res.status);
    console.log("Headers:", Array.from(res.headers.entries()));
    const text = await res.text();
    console.log("Body preview:", text.slice(0, 100));
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}
test();
