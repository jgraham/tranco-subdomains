const trancoScriptSrc = new URL(document.currentScript.src);

async function getTrancoUrl(domain) {
  const msg = new TextEncoder().encode(domain);
  const hashBuffer = await crypto.subtle.digest("SHA-1", msg);
  const sha1 = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${trancoScriptSrc.protocol}//${trancoScriptSrc.hostname}/tranco-subdomains/ranks/domains/${sha1.slice(0,2)}/${sha1.slice(2,4)}/${sha1.slice(4)}.json`;
}

async function rankUrl(url) {
  if (!url.includes("://")) {
    url = `https://${url}`;
  }
  const parsedUrl = new URL(url);
  let targetDomain = parsedUrl.host;
  let rank = null;
  const tried = [];
  while (targetDomain.includes(".")) {
    tried.push(targetDomain);
    const domainRankUrl = await getTrancoUrl(targetDomain);
    const resp = await fetch(domainRankUrl);
    if (resp.status === 200) {
      const data = await resp.json();
      // TODO: check if this is actually correct for the latest date
      if (data && data.ranks.length) {
        rank = data.ranks[0].rank;
        break;
      }
    } else if (resp.status !== 404) {
      console.error(`Failed to load ${domainRankUrl}`, resp);
      throw new Error(resp);
    }
    const [first, ...rest] = targetDomain.split(".");
    targetDomain = rest.join(".");
  }
  if (rank === null) {
    console.log(`Failed to get domain rank; tried domains ${tried.join(", ")}`);
  }
  return {rank, rankedDomain: rank ? targetDomain : parsedUrl.host};
}
