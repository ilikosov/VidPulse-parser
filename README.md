# @ilikosov/vidpulse-parser

TypeScript library skeleton for VidPulse title parsing.

## Installation

```bash
npm install @ilikosov/vidpulse-parser
```

## Usage

```ts
import { parseTitle } from '@ilikosov/vidpulse-parser';

const parsed = parseTitle('  Hello VidPulse  ');

console.log(parsed);
// {
//   source: '  Hello VidPulse  ',
//   title: 'Hello VidPulse',
//   normalizedTitle: 'hello vidpulse'
// }
```

## Development

```bash
npm run build
npm test
```
