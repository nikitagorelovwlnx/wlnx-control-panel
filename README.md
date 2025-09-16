# WLNX Control Panel

Lightweight TypeScript browser interface for displaying data from [wlnx-api-server](https://github.com/nikitagorelovwlnx/wlnx-api-server).

## Features

- 👥 **Users** - view user list with their statuses
- 💬 **Interviews** - real-time interview chat messages
- 📋 **Summaries** - interview summaries and results

## Technologies

- TypeScript
- Vanilla JavaScript (no frameworks)
- Modern CSS
- ES Modules

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Build Project
```bash
npm run build
```

### 3. Run in Development Mode
```bash
npm run dev
```

Application will be available at: http://localhost:3000

### 4. Production
```bash
npm run start
```

## Project Structure

```
wlnx-control-panel/
├── src/
│   ├── api/
│   │   └── client.ts          # API client for server communication
│   ├── components/
│   │   ├── UsersList.ts       # Users list component
│   │   ├── ChatView.ts        # Chat messages component
│   │   └── SummaryView.ts     # Summary display component
│   ├── types/
│   │   └── api.ts            # TypeScript interfaces
│   ├── styles/
│   │   └── main.css          # Main styles
│   └── index.ts              # Main application file
├── dist/                     # Compiled files
├── index.html               # Main HTML page
├── package.json
└── tsconfig.json
```

## API Configuration

By default, the application connects to the API server at `http://localhost:8000`.

To change the API server address, edit the file `src/api/client.ts`:

```typescript
constructor(baseUrl: string = 'YOUR_API_URL') {
    this.baseUrl = baseUrl;
}
```

## Expected API Endpoints

The application expects the following endpoints from the API server:

- `GET /api/health` - API health check
- `GET /api/users` - users list
- `GET /api/interviews` - interviews list
- `GET /api/interviews/{id}/messages` - interview messages
- `GET /api/interviews/{id}/summary` - interview summary

## Features

- ✅ Responsive design for mobile devices
- ✅ Automatic API connection checking
- ✅ Error handling and loading states
- ✅ Modern Material Design interface
- ✅ No authentication required
- ✅ Lightweight - minimal dependencies

## Development

### Commands

- `npm run build` - compile TypeScript to JavaScript
- `npm run dev` - development mode with auto-reload
- `npm run start` - start static server
- `npm run type-check` - type checking without compilation

### Adding New Features

1. Add new types to `src/types/api.ts`
2. Update API client in `src/api/client.ts`
3. Create new component in `src/components/`
4. Update main application in `src/index.ts`

## License

MIT
