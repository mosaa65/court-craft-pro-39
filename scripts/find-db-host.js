import dns from "dns";
import pg from "pg";

const regions = [
  "eu-central-1",
  "me-central-1",
  "ap-southeast-1",
  "us-east-1",
  "eu-west-1",
  "us-west-1",
  "sa-east-1"
];

const projectId = "llvszoblxpblvwzmlkeq";
const password = "snuptN7cg57qoswN";

async function testHost(host, port, user) {
  return new Promise((resolve) => {
    const client = new pg.Client({
      host,
      port,
      user,
      password,
      database: "postgres",
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 3000
    });
    client.connect((err) => {
      if (err) {
        resolve({ host, port, ok: false, err: err.message });
      } else {
        client.end();
        resolve({ host, port, ok: true });
      }
    });
  });
}

async function run() {
  console.log("Checking Supabase DB Hosts...");

  // Try direct host
  console.log("Trying direct db host...");
  const direct = await testHost(`db.${projectId}.supabase.co`, 5432, "postgres");
  console.log("Direct Result:", direct);

  if (direct.ok) return direct;

  for (const reg of regions) {
    const poolerHost = `aws-0-${reg}.pooler.supabase.com`;
    console.log(`Trying Pooler: ${poolerHost} ...`);
    const res5432 = await testHost(poolerHost, 5432, `postgres.${projectId}`);
    if (res5432.ok) {
      console.log("FOUND WORKING POOLER HOST (5432):", poolerHost);
      return { host: poolerHost, port: 5432, user: `postgres.${projectId}` };
    }
    const res6543 = await testHost(poolerHost, 6543, `postgres.${projectId}`);
    if (res6543.ok) {
      console.log("FOUND WORKING POOLER HOST (6543):", poolerHost);
      return { host: poolerHost, port: 6543, user: `postgres.${projectId}` };
    }
  }

  console.log("None of the poolers succeeded via default regions.");
}

run().catch(console.error);
