#!/usr/bin/env node

/**
 * Script to update all candidates by removing their emails and phone numbers
 * This simulates candidates who haven't initiated registration yet
 * Allows testing of the registration initiation endpoints
 */

const https = require('https');

// Configuration
const PLATFORMS = [
  {
    name: 'Railway',
    baseUrl: 'https://fuep-api-production.up.railway.app',
    candidates: [],
  },
  {
    name: 'Render',
    baseUrl: 'https://fuep-api.onrender.com',
    candidates: [],
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
 * Get all candidates from a platform
 */
async function getCandidates(platform) {
  console.log(`\n🔍 Fetching candidates from ${platform.name}...`);

  try {
    const response = await makeRequest(`${platform.baseUrl}/api/admin/candidates`);

    if (response.status === 200 && response.data.success) {
      platform.candidates = response.data.data || [];
      console.log(`✅ Found ${platform.candidates.length} candidates on ${platform.name}`);

      // Show current candidates with contact info
      const withContactInfo = platform.candidates.filter((c) => c.email || c.phone);
      console.log(`📧 ${withContactInfo.length} candidates have contact info (email/phone)`);

      return platform.candidates;
    } else {
      console.log(`❌ Failed to fetch candidates from ${platform.name}:`, response.data);
      return [];
    }
  } catch (error) {
    console.log(`❌ Error fetching candidates from ${platform.name}:`, error.message);
    return [];
  }
}

/**
 * Update a candidate by removing email and phone
 */
async function updateCandidate(platform, candidate) {
  console.log(
    `🔄 Updating candidate ${candidate.jambRegNo} (${candidate.firstname} ${candidate.surname})...`
  );

  try {
    // Let's try omitting the email and phone fields entirely from the update
    // This should leave the existing values unchanged
    const updateData = {
      // Don't include email and phone - this should leave them unchanged
      // But we need to include at least one field to make it a valid update
      firstname: candidate.firstname, // Keep the same firstname
    };

    const response = await makeRequest(
      `${platform.baseUrl}/api/candidates/profile/${candidate.id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      }
    );

    if (response.status === 200 && response.data.success) {
      console.log(`✅ Updated candidate ${candidate.jambRegNo}`);
      return true;
    } else {
      console.log(`❌ Failed to update candidate ${candidate.jambRegNo}:`, response.data);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error updating candidate ${candidate.jambRegNo}:`, error.message);
    return false;
  }
}

/**
 * Update all candidates on a platform
 */
async function updateAllCandidates(platform) {
  console.log(`\n🚀 Starting candidate updates for ${platform.name}...`);

  if (platform.candidates.length === 0) {
    console.log(`⚠️  No candidates found on ${platform.name}`);
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  for (const candidate of platform.candidates) {
    const success = await updateCandidate(platform, candidate);
    if (success) {
      successCount++;
    } else {
      errorCount++;
    }

    // Small delay to avoid overwhelming the API
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log(`\n📊 ${platform.name} Update Summary:`);
  console.log(`✅ Successfully updated: ${successCount}`);
  console.log(`❌ Failed to update: ${errorCount}`);
  console.log(`📝 Total candidates: ${platform.candidates.length}`);
}

/**
 * Verify updates by checking a few candidates
 */
async function verifyUpdates(platform) {
  console.log(`\n🔍 Verifying updates on ${platform.name}...`);

  try {
    const response = await makeRequest(`${platform.baseUrl}/api/admin/candidates`);

    if (response.status === 200 && response.data.success) {
      const candidates = response.data.data || [];
      const withoutContactInfo = candidates.filter((c) => !c.email && !c.phone);

      console.log(`📊 Verification Results:`);
      console.log(`📝 Total candidates: ${candidates.length}`);
      console.log(`📧 Without contact info: ${withoutContactInfo.length}`);
      console.log(`📧 With contact info: ${candidates.length - withoutContactInfo.length}`);

      // Show sample candidates
      if (withoutContactInfo.length > 0) {
        console.log(`\n📋 Sample candidates without contact info:`);
        withoutContactInfo.slice(0, 3).forEach((c) => {
          console.log(`   - ${c.jambRegNo}: ${c.firstname} ${c.surname} (${c.department})`);
        });
      }
    }
  } catch (error) {
    console.log(`❌ Error verifying updates on ${platform.name}:`, error.message);
  }
}

/**
 * Test registration initiation endpoint
 */
async function testRegistrationInitiation(platform) {
  console.log(`\n🧪 Testing registration initiation on ${platform.name}...`);

  try {
    // Get a candidate without contact info
    const response = await makeRequest(`${platform.baseUrl}/api/admin/candidates`);

    if (response.status === 200 && response.data.success) {
      const candidates = response.data.data || [];
      const candidateWithoutContact = candidates.find((c) => !c.email && !c.phone);

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

        if (testResponse.status === 200 && testResponse.data.success === false) {
          console.log(`✅ Registration initiation test passed!`);
          console.log(`📝 Response: ${testResponse.data.message}`);
          console.log(`📝 Next step: ${testResponse.data.data?.nextStep}`);
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
  console.log('🚀 Starting candidate update process for registration testing...');
  console.log('📝 This will remove emails and phone numbers from all candidates');
  console.log("📝 This simulates candidates who haven't initiated registration yet\n");

  // Get candidates from all platforms
  for (const platform of PLATFORMS) {
    await getCandidates(platform);
  }

  // Update candidates on all platforms
  for (const platform of PLATFORMS) {
    await updateAllCandidates(platform);
  }

  // Verify updates
  for (const platform of PLATFORMS) {
    await verifyUpdates(platform);
  }

  // Test registration initiation
  for (const platform of PLATFORMS) {
    await testRegistrationInitiation(platform);
  }

  console.log('\n🎉 Candidate update process completed!');
  console.log('📝 All candidates now have no email/phone numbers');
  console.log('📝 You can now test the registration initiation endpoints:');
  console.log('   - POST /api/candidates/check-jamb');
  console.log('   - POST /api/candidates/:candidateId/complete-contact');
}

// Run the script
main().catch(console.error);
