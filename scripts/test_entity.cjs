const sql = require('c:/ALL/OFFICE/data-exchange/node_modules/mssql');
const path = require('path');
require('c:/ALL/OFFICE/data-exchange/node_modules/dotenv').config({ path: 'c:/ALL/OFFICE/data-exchange/.env.local' });

const config = {
  server: process.env.DB_HOST || 'intluatdb',
  port: parseInt(process.env.DB_PORT || '2026', 10),
  database: 'Lawton_Provider',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: true,
  }
};

async function testEntity() {
  console.log('Connecting to SQL Server...', config.server, config.port);
  try {
    const pool = await sql.connect(config);
    console.log('Connected successfully!');

    // 1. Check Group Corporate (Provider Corp ID / E_ParentId = 1422138 or E_ID = 1422138)
    const groupRes = await pool.request().query(`
      SELECT E_ID, E_ParentId, E_DisplayName, E_FullName, E_ShortName, E_ISACTIVE
      FROM Lawton_Provider.pmr.ENTITY
      WHERE E_ID = 1422138 OR E_ParentId = 1422138
    `);
    console.log('\n--- Group Corporate Entities (1422138) ---');
    console.table(groupRes.recordset);

    // 2. Check Single Corporate (1422104)
    const singleRes = await pool.request().query(`
      SELECT E_ID, E_ParentId, E_DisplayName, E_FullName, E_ShortName, E_ISACTIVE
      FROM Lawton_Provider.pmr.ENTITY
      WHERE E_ID = 1422104 OR E_ParentId = 1422104
    `);
    console.log('\n--- Single Corporate Entities (1422104) ---');
    console.table(singleRes.recordset);

    // 3. Query Policies for both in Lawton.dbo.tblmapolicy
    const policyRes = await pool.request().query(`
      SELECT PolID, PolNo, Pol_CorporateId, polbrokerid, PolActive, PolStartDate, PolEndDate
      FROM Lawton.dbo.tblmapolicy
      WHERE Pol_CorporateId IN (1422104, 1422138, 1422139, 1422140, 1422141)
         OR Pol_CorporateId IN (SELECT E_ID FROM Lawton_Provider.pmr.ENTITY WHERE E_ParentId = 1422138)
    `);
    console.log('\n--- Associated Policies in tblmapolicy ---');
    console.table(policyRes.recordset);

    await pool.close();
  } catch (err) {
    console.error('Database Error:', err.message);
  }
}

testEntity();
