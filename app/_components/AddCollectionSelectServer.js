"use server";

export async function pollJob(jobId) {
  console.log(`pollJob ${jobId}`);
  let res = await fetch(
    `http://production-tools/plot-navigator/cache/job/${jobId}`,
  );
  let data = await res.json();
  console.log(res.json());
  return data;
}

export async function putCollection(repo, collectionName) {
  let res = await fetch("http://production-tools/plot-navigator/cache/", {
    method: "PUT",
    body: JSON.stringify({ repo: repo, collection: collectionName }),
    headers: { "Content-Type": "application/json" },
  });
  let data = await res.json();
  console.log(`putCollection ${JSON.stringify(data)}`);

  return data.jobId;
}
