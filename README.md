# BAR Wind Simulation

Simulates the wind speed algorithm used by [Beyond All Reason](https://www.beyondallreason.info/) outside of the game. Useful for planning build orders with realistic wind data.
Wind simulation is based on the original BAR simulation source: [Wind.cpp](https://github.com/beyond-all-reason/RecoilEngine/blob/master/rts/Sim/Misc/Wind.cpp).

## Requirements

- [Bun](https://bun.sh/)

## Usage

```bash
bun index.ts <durationSeconds> [minStrength] [maxStrength] [--per-second]
```

| Argument          | Description                                        | Default |
|-------------------|----------------------------------------------------|---------|
| `durationSeconds` | How many in-game seconds to simulate               | —       |
| `minStrength`     | Minimum wind strength                              | `0`     |
| `maxStrength`     | Maximum wind strength                              | `100`   |
| `--per-second`    | Output one value per second instead of every 0.1s | off     |

## Examples

```bash
# Simulate 10 minutes of wind with BAR's default strength range
bun index.ts 600

# Simulate 10 minutes with a custom strength range, one row per second
bun index.ts 600 2 16 --per-second
```

### Example output

```
Simulating 600s of wind (min=2, max=16)

Time (s)  Strength
--------  ---------
     0.0       9.00
     1.0       9.02
     2.0       9.07
     3.0       9.16
     ...
```

## How it works

Updates wind at 10 fps. Each update smoothly interpolates toward a new randomly generated wind target over ~15 seconds (150 frames). This tool replicates that algorithm exactly, so the output matches what you would see in an actual game.

## Author

Wind speed simulation was made by Baldric.  
The index.ts file and README were made by Claude.
