import json
import hashlib
import os
from datetime import date
from typing import Any, Iterator

import requests

top_dir = os.path.dirname(__file__)


def get_list_metadata() -> str:
    resp = requests.get("https://tranco-list.eu/api/lists/date/latest?subdomains=true")
    resp.raise_for_status()
    list_data = resp.json()
    return list_data


def iter_list(url: str) -> Iterator[tuple[int, str]]:
    resp = requests.get(url)
    resp.raise_for_status()
    for line in resp.iter_lines(decode_unicode=True):
        line = line.strip()
        if not line:
            continue
        rank, domain = line.split(",", 1)
        yield int(rank), domain


def get_domain_path_parts(domain: str) -> tuple[str, str, str]:
    domain_hash = hashlib.sha1(domain.encode("utf8")).hexdigest()
    parts = (domain_hash[0:2], domain_hash[2:4], domain_hash[4:])
    return parts


def write_domain(date: str, output_dir: str, domain: str, rank: int):
    path_parts = get_domain_path_parts(domain)
    output_path = os.path.join(output_dir, *path_parts[:2])
    os.makedirs(output_path, exist_ok=True)
    output_file = os.path.join(output_path, path_parts[-1])
    if os.path.exists(output_file):
        with open(output_file) as f:
            data = json.load(f)
    else:
        data = {
            "domain": domain,
            "ranks": []
        }

    assert data["domain"] == domain

    data["ranks"].insert(0, {"date": date, "rank": rank})

    with open(output_file, "w") as f:
        json.dump(data, f, indent=2)


def get_current_metadata(meta_path: str) -> dict[str, Any]:
    if os.path.exists(meta_path):
        with open(meta_path) as f:
            current_metadata = json.load(f)
    else:
        current_metadata = None


def main():
    meta_path = os.path.join(top_dir, "ranks", "latest.json")
    output_path = os.path.join(top_dir, "ranks", "domains")

    current_metadata = get_current_metadata(meta_path)
    new_metadata = get_list_metadata()
    if current_metadata and current_metadata["list_id"] == new_metadata["list_id"]:
        print(f"Already up to date with list {current_metadata['list_id']}")
        return

    date = new_metadata["configuration"]["endDate"]
    for rank, domain in iter_list(new_metadata["download"]):
        write_domain(date, output_path, domain, rank)

    with open(meta_path, "w") as f:
        json.dump(new_metadata, f, indent=2)


if __name__ == "__main__":
    main()
