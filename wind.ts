const randomFloat = () => {
	if (typeof window === 'undefined' || !window.crypto) {
		return Math.random;
	}
	const max = Math.pow(2, 32);
	const u32 = new Uint32Array(1);

	return function random() {
		// CSPRNG
		return crypto.getRandomValues(u32)[0] / max;
	};
};
const random = randomFloat();

type Vector2 = { x: number; z: number };

class WindSimulator {
	private curWindStrength: number = 0.0;
	private minWindStrength: number = 0.0;
	private maxWindStrength: number = 100.0;
	private curWindDir: Vector2 = { x: 1, z: 0 }; // Initial/default direction
	private curWindVec: Vector2 = { x: 0, z: 0 };
	private newWindVec: Vector2 = { x: 0, z: 0 }; // Target wind vector for current cycle
	private oldWindVec: Vector2 = { x: 0, z: 0 }; // Wind vector at the start of current cycle
	private windDirTimer: number = 0;
	// WIND_UPDATE_RATE is the number of frames for the smooth transition (e.g., 15s * 10fps = 150)
	// A new wind target will be picked every (WIND_UPDATE_RATE + 1) frames.
	private WIND_UPDATE_RATE: number = 15 * 10;

	constructor(minStrength: number, maxStrength: number) {
		this.minWindStrength = Math.min(minStrength, maxStrength);
		this.maxWindStrength = Math.max(minStrength, maxStrength);
		this.windDirTimer = 0;
		this.loadInitialWind();
	}

	private loadInitialWind() {
		let strength: number;
		do {
			// Initialize curWindDir with a random normalized direction
			this.curWindDir = { x: random() * 2 - 1, z: random() * 2 - 1 }; // Random components [-1, 1]
			strength = this.normalizeVector(this.curWindDir); // Normalizes in-place
		} while (strength === 0); // Ensure it's not a zero vector

		const avgStrength = this.getAverageWindStrength();
		this.curWindStrength = avgStrength; // Initialize curWindStrength
		this.curWindVec = this.scaleVector(this.curWindDir, avgStrength);
		this.oldWindVec = { ...this.curWindVec };
		// newWindVec will be initialized in the first update cycle
	}

	private normalizeVector(vec: Vector2): number {
		const length = Math.sqrt(vec.x ** 2 + vec.z ** 2);
		if (length > 0) {
			vec.x /= length;
			vec.z /= length;
		}
		return length;
	}

	private scaleVector(vec: Vector2, scale: number): Vector2 {
		return { x: vec.x * scale, z: vec.z * scale };
	}

	private getAverageWindStrength(): number {
		return (this.minWindStrength + this.maxWindStrength) / 2;
	}

	private clamp(value: number, min: number, max: number): number {
		return Math.max(min, Math.min(max, value));
	}

	private mixVectors(vec1: Vector2, vec2: Vector2, t: number): Vector2 {
		return {
			x: vec1.x * (1 - t) + vec2.x * t,
			z: vec1.z * (1 - t) + vec2.z * t,
		};
	}

	private smoothStep(edge0: number, edge1: number, x: number): number {
		x = this.clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
		return x * x * (3 - 2 * x);
	}

	private generateNewWindTarget() {
		// this.newWindVec has already been initialized to this.oldWindVec (i.e. curWindVec from end of last cycle)
		let newCalculatedStrength: number;
		do {
			// Perturb the current newWindVec (which was copied from oldWindVec)
			this.newWindVec.x += (random() - 0.5) * this.maxWindStrength;
			this.newWindVec.z += (random() - 0.5) * this.maxWindStrength;
			newCalculatedStrength = Math.sqrt(this.newWindVec.x ** 2 + this.newWindVec.z ** 2);
		} while (newCalculatedStrength === 0);

		const clampedStrength = this.clamp(newCalculatedStrength, this.minWindStrength, this.maxWindStrength);

		// Normalize newWindVec and then scale it to the clampedStrength
		if (newCalculatedStrength > 0) {
			// Should always be true
			this.newWindVec.x = (this.newWindVec.x / newCalculatedStrength) * clampedStrength;
			this.newWindVec.z = (this.newWindVec.z / newCalculatedStrength) * clampedStrength;
		} else {
			// Fallback, though loop should prevent this
			this.newWindVec.x = 0;
			this.newWindVec.z = 0;
		}
	}

	public update(frameDelta: number) {
		// frameDelta is assumed to be 1 from your gameLoop
		if (this.maxWindStrength <= 0) return;

		if (this.windDirTimer === 0) {
			this.oldWindVec = { ...this.curWindVec }; // curWindVec is from the end of the last cycle
			this.newWindVec = { ...this.oldWindVec }; // Initialize new target from the current wind state
			this.generateNewWindTarget(); // Perturb newWindVec to set the new target
		}
		// Smooth interpolation factor. windDirTimer goes 0...WIND_UPDATE_RATE.
		// mod goes 0...1 over WIND_UPDATE_RATE frames.
		const mod = this.smoothStep(0, 1, this.windDirTimer / this.WIND_UPDATE_RATE);

		// Interpolate current wind vector based on old and new targets
		this.curWindVec = this.mixVectors(this.oldWindVec, this.newWindVec, mod);

		// Calculate current strength and normalize curWindVec (in place)
		// normalizeVector returns the original length before normalization.
		const originalLength = this.normalizeVector(this.curWindVec);
		this.curWindStrength = this.clamp(originalLength, this.minWindStrength, this.maxWindStrength);

		// curWindVec is now normalized (or {0,0} if originalLength was 0).
		// Update curWindDir with this normalized direction.
		this.curWindDir = { ...this.curWindVec };

		// Rescale curWindVec to its actual strength using the (now normalized) curWindDir.
		this.curWindVec = this.scaleVector(this.curWindDir, this.curWindStrength);

		// Increment timer. It cycles from 0 to WIND_UPDATE_RATE.
		// A new cycle (and new target wind) begins every (WIND_UPDATE_RATE + 1) frames.
		this.windDirTimer = (this.windDirTimer + frameDelta) % (this.WIND_UPDATE_RATE + 1);
	}

	public getCurrentWind(): { direction: Vector2; strength: number } {
		return { direction: { ...this.curWindDir }, strength: this.curWindStrength };
	}
}

export default WindSimulator;
