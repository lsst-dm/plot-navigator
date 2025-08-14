import { GetObjectCommand } from "@aws-sdk/client-s3";
import { GetClient } from "@/lib/summaries";

export async function GET(request, { params }) {
  const path = decodeURIComponent(params.path);
  const filename = params.filename;

  const client = GetClient();
  const command = new GetObjectCommand({
    Bucket: process.env.BUCKET_NAME,
    Key: `images/${encodeURIComponent(path)}/${encodeURIComponent(filename)}`,
  });

  try {
    const response = await client.send(command);
    const imgData = await response.Body.transformToByteArray();
    return new Response(imgData, { headers: { "content-type": "image/png" } });
  } catch (err) {
    console.error(err);
    return new Response("", { status: 500 });
  }
}
