#!/usr/bin/env node

/**
 * Script to create test candidates without email and phone numbers
 * This simulates candidates who haven't initiated registration yet
 * Allows testing of the registration initiation endpoints
 */

const https = require('https');

// Configuration
const PLATFORMS = [
  {
    name: 'Railway',
    baseUrl: 'https://fuep-api-production.up.railway.app',
  },
  {
    name: 'Render',
    baseUrl: 'https://fuep-api.onrender.com',
  },
];

/**
 * Make HTTP request
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

/**
 * Get available departments from a platform
 */
async function getDepartments(platform) {
  console.log(`\n🔍 Fetching departments from ${platform.name}...`);

  try {
    const response = await makeRequest(`${platform.baseUrl}/api/admin/departments`);

    if (response.status === 200 && response.data.success) {
      const departments = response.data.data || [];
      console.log(`✅ Found ${departments.length} departments on ${platform.name}`);
      return departments;
    } else {
      console.log(`❌ Failed to fetch departments from ${platform.name}:`, response.data);
      return [];
    }
  } catch (error) {
    console.log(`❌ Error fetching departments from ${platform.name}:`, error.message);
    return [];
  }
}

/**
 * Create a test candidate without email and phone
 */
async function createTestCandidate(platform, department, index) {
  const jambRegNo = `202511595352D${String.fromCharCode(65 + index)}`; // DA, DB, DC, etc.
  const firstname = `Test${index + 1}`;
  const surname = `Candidate${index + 1}`;

  console.log(`🔄 Creating test candidate ${jambRegNo} (${firstname} ${surname})...`);

  try {
    const candidateData = {
      jambRegNo: jambRegNo,
      firstname: firstname,
      surname: surname,
      othernames: `Middle${index + 1}`,
      gender: index % 2 === 0 ? 'male' : 'female',
      dob: '2005-01-01',
      nationality: 'Nigerian',
      state: 'Lagos',
      lga: 'Ikeja',
      address: `${100 + index} Test Street, Lagos`,
      // Don't include email and phone - this is the key!
      department: department.name,
      departmentId: department.id,
      modeOfEntry: 'UTME',
      maritalStatus: 'single',
      registrationCompleted: false,
      biodataCompleted: false,
      educationCompleted: false,
      nextOfKinCompleted: false,
      sponsorCompleted: false,
      passwordHash: null, // No password hash - hasn't initiated registration
      isFirstLogin: false,
      isActive: true,
    };

    const response = await makeRequest(`${platform.baseUrl}/api/admin/candidates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(candidateData),
    });

    if (response.status === 201 && response.data.success) {
      console.log(`✅ Created test candidate ${jambRegNo}`);
      return true;
    } else {
      console.log(`❌ Failed to create test candidate ${jambRegNo}:`, response.data);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error creating test candidate ${jambRegNo}:`, error.message);
    return false;
  }
}

/**
 * Create test candidates on a platform
 */
async function createTestCandidates(platform) {
  console.log(`\n🚀 Creating test candidates for ${platform.name}...`);

  // Get available departments
  const departments = await getDepartments(platform);

  if (departments.length === 0) {
    console.log(`⚠️  No departments found on ${platform.name}, skipping candidate creation`);
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  // Create 3 test candidates
  for (let i = 0; i < 3; i++) {
    const department = departments[i % departments.length]; // Cycle through departments
    const success = await createTestCandidate(platform, department, i);
    if (success) {
      successCount++;
    } else {
      errorCount++;
    }

    // Small delay to avoid overwhelming the API
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  console.log(`\n📊 ${platform.name} Creation Summary:`);
  console.log(`✅ Successfully created: ${successCount}`);
  console.log(`❌ Failed to create: ${errorCount}`);
  console.log(`📝 Total candidates attempted: 3`);
}

/**
 * Test registration initiation endpoint
 */
async function testRegistrationInitiation(platform) {
  console.log(`\n🧪 Testing registration initiation on ${platform.name}...`);

  try {
    // Get candidates to find one without contact info
    const response = await makeRequest(`${platform.baseUrl}/api/admin/candidates`);

    if (response.status === 200 && response.data.success) {
      const candidates = response.data.data || [];
      const candidateWithoutContact = candidates.find((c) => !c.email || !c.phone);

      if (candidateWithoutContact) {
        console.log(`🎯 Testing with candidate: ${candidateWithoutContact.jambRegNo}`);

        const testResponse = await makeRequest(`${platform.baseUrl}/api/candidates/check-jamb`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jambRegNo: candidateWithoutContact.jambRegNo,
          }),
        });

        if (testResponse.status === 200) {
          if (
            testResponse.data.success === false &&
            testResponse.data.data?.nextStep === 'complete_contact'
          ) {
            console.log(`✅ Registration initiation test passed!`);
            console.log(`📝 Response: ${testResponse.data.message}`);
            console.log(`📝 Next step: ${testResponse.data.data?.nextStep}`);
            console.log(
              `📝 Requires contact update: ${testResponse.data.data?.requiresContactUpdate}`
            );
          } else {
            console.log(`⚠️  Unexpected response:`, testResponse.data);
          }
        } else {
          console.log(`❌ Registration initiation test failed:`, testResponse.data);
        }
      } else {
        console.log(`⚠️  No candidates without contact info found for testing`);
      }
    }
  } catch (error) {
    console.log(`❌ Error testing registration initiation on ${platform.name}:`, error.message);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Creating test candidates for registration testing...');
  console.log('📝 This will create candidates without email/phone numbers');
  console.log("📝 This simulates candidates who haven't initiated registration yet\n");

  // Create test candidates on all platforms
  for (const platform of PLATFORMS) {
    await createTestCandidates(platform);
  }

  // Test registration initiation
  for (const platform of PLATFORMS) {
    await testRegistrationInitiation(platform);
  }

  console.log('\n🎉 Test candidate creation completed!');
  console.log('📝 New candidates created without email/phone numbers');
  console.log('📝 You can now test the registration initiation endpoints:');
  console.log('   - POST /api/candidates/check-jamb');
  console.log('   - POST /api/candidates/:candidateId/complete-contact');
}

// Run the script
main().catch(console.error);
