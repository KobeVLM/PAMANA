const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgres://postgres.wfaxyjcjjymyjibvpqni:lEZ0HnX7r7LaO2O6@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres'
});

async function run() {
  await client.connect();
  const res = await client.query("DELETE FROM vocabulary_items WHERE word IN ('damit', 'sapatos', 'silya', 'mesa', 'pintuan', 'baso')");
  console.log(`Deleted ${res.rowCount} rows`);
  await client.end();
}
run().catch(console.error);
