async function getTrancoUrl(domain) {
  const msg = new TextEncoder().encode(domain);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msg);
  const sha1 = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const scriptUrl = new URL(document.currentScript.src);
  return `${scriptUrl.protocol}://${scriptUrl.hostname}/ranks/domains/${sha1.slice(0,2)}/${sha1.slice(2,4)}/${sha1.slice(4)}`;
}
