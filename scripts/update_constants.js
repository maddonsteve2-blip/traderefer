/**
 * Replace AUSTRALIA_LOCATIONS in lib/constants.ts with the generated version
 */
const fs = require('fs');
const path = require('path');

const constantsPath = path.resolve('C:/Users/61479/Documents/trade-refer-stitch/apps/web/lib/constants.ts');
const generatedPath = path.resolve('C:/Users/61479/Documents/trade-refer-stitch/scripts/generated_locations.ts');

const constantsContent = fs.readFileSync(constantsPath, 'utf-8');
const generatedContent = fs.readFileSync(generatedPath, 'utf-8');

// Extract just the AUSTRALIA_LOCATIONS object from generated file (skip header comments)
const genMatch = generatedContent.match(/export const AUSTRALIA_LOCATIONS: LocationData = \{[\s\S]*?\n\};/);
if (!genMatch) {
    console.error('Could not find AUSTRALIA_LOCATIONS in generated file');
    process.exit(1);
}
const newLocations = genMatch[0];

// Find and replace in constants.ts
const oldPattern = /export const AUSTRALIA_LOCATIONS: LocationData = \{[\s\S]*?\n\};/;
const oldMatch = constantsContent.match(oldPattern);
if (!oldMatch) {
    console.error('Could not find AUSTRALIA_LOCATIONS in constants.ts');
    process.exit(1);
}

console.log(`Old AUSTRALIA_LOCATIONS: ${oldMatch[0].split('\n').length} lines`);
console.log(`New AUSTRALIA_LOCATIONS: ${newLocations.split('\n').length} lines`);

const updatedContent = constantsContent.replace(oldPattern, newLocations);
fs.writeFileSync(constantsPath, updatedContent);

console.log('✅ AUSTRALIA_LOCATIONS replaced in constants.ts');

// Verify
const verify = fs.readFileSync(constantsPath, 'utf-8');
const verifyMatch = verify.match(/export const AUSTRALIA_LOCATIONS: LocationData = \{/);
const stLicensing = verify.match(/export const STATE_LICENSING/);
console.log(`AUSTRALIA_LOCATIONS found: ${!!verifyMatch}`);
console.log(`STATE_LICENSING still present: ${!!stLicensing}`);

// Count new cities and suburbs
const newMatch = verify.match(/export const AUSTRALIA_LOCATIONS: LocationData = \{[\s\S]*?\n\};/);
const cityMatches = newMatch[0].match(/"[A-Z][a-z][^"]*":\s*\[/g);
console.log(`Cities in updated file: ${cityMatches ? cityMatches.length : 0}`);
