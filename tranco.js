const trancoScriptSrc = new URL(document.currentScript.src);

async function getTrancoUrl(domain) {
  const msg = new TextEncoder().encode(domain);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msg);
  const sha1 = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${trancoScriptSrc.protocol}//${trancoScriptSrc.hostname}/ranks/domains/${sha1.slice(0,2)}/${sha1.slice(2,4)}/${sha1.slice(4)}`;
}

async function rankUrl(url) {
  if (!url.includes("://")) {
    url = `https://${url}`;
  }
  const parsedUrl = new URL(url);
  let targetDomain = parsedUrl.host;
  let rank = null;
  while (targetDomain.includes(".")) {
    const domainRankUrl = await getTrancoUrl(targetDomain);
    const resp = await fetch(domainRankUrl);
    const data = await resp.json();
    // TODO: check if this is actually correct for the latest date
    if (data && data.ranks.length) {
      rank = data.ranks[0].rank;
      break;
    }
    const [first, ...rest] = targetDomain.split(".");
    targetDomain = rest.join(".");
  }
  return {rank, rankedDomain: rank ? targetDomain : parsedUrl.host};
}
