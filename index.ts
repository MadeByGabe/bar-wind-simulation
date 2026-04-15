import WindSimulator from './wind';

// --- Argument parsing ---
// Usage: bun index.ts <seconds> [minStrength] [maxStrength] [--per-second]
const flags = process.argv.filter(a => a.startsWith('--'));
const args = process.argv.slice(2).filter(a => !a.startsWith('--'));

const perSecond = flags.includes('--per-second');

const durationSeconds = parseFloat(args[0]);
const minStrength = args[1] !== undefined ? parseFloat(args[1]) : 0;
const maxStrength = args[2] !== undefined ? parseFloat(args[2]) : 100;

if (!args[0] || isNaN(durationSeconds) || durationSeconds <= 0) {
	console.error('Usage: bun index.ts <durationSeconds> [minStrength] [maxStrength] [--per-second]');
	console.error('  durationSeconds  How many in-game seconds to simulate');
	console.error('  minStrength      Minimum wind strength (default: 0)');
	console.error('  maxStrength      Maximum wind strength (default: 100)');
	console.error('  --per-second     Output one value per second instead of every 0.1s');
	process.exit(1);
}

// BAR runs the wind update at 10 fps (every 0.1s game time)
const UPDATES_PER_SECOND = 10;
const totalFrames = Math.ceil(durationSeconds * UPDATES_PER_SECOND);

const sim = new WindSimulator(minStrength, maxStrength);

console.log(`Simulating ${durationSeconds}s of wind (min=${minStrength}, max=${maxStrength})\n`);
console.log('Time (s)  Strength');
console.log('--------  ---------');

for (let frame = 0; frame <= totalFrames; frame++) {
	const shouldPrint = perSecond ? frame % UPDATES_PER_SECOND === 0 : true;

	if (shouldPrint) {
		const timeSeconds = frame / UPDATES_PER_SECOND;
		const { strength } = sim.getCurrentWind();

		const time = timeSeconds.toFixed(1).padStart(8);
		const str = strength.toFixed(2).padStart(9);

		console.log(`${time}  ${str}`);
	}

	sim.update(1);
}
