# Docker Manager

A simple and intuitive web interface for managing your local Docker containers. Perfect for those who doesn't want to deal with bloated desktop apps and sometimes the terminal seems to little for the use case.

## What's Inside?

- 🎨 **Clean Interface**: A modern, responsive UI that makes container management a breeze
- 📊 **Live Stats**: Keep an eye on your containers with real-time stats and logs
- 🎮 **Easy Controls**: Start, stop, restart, and delete containers with a single click
- 🔍 **Quick Search**: Find any container instantly by name, image, or status
- 🎯 **Local First**: Built for local development, no complex setup needed

## Tech Stack

### Frontend
- React 18 + TypeScript
- Tailwind CSS for styling
- Vite for fast development
- Lucide React for icons

### Backend
- Go 1.24
- Echo Framework
- Docker SDK
- SQLite for local data

## Getting Started

### Backend Setup

1. Make sure you have Go and Docker installed on your machine
2. Clone the repo and cd into it:
   ```bash
   git clone https://github.com/yourusername/docker-manager.git
   cd docker-manager
   ```

3. Install Go dependencies:
   ```bash
   go mod download
   ```

4. Create a `.env` file:
   ```env
   PORT=8080
   BLUEPRINT_DB_URL=./data/docker-manager.db
   ```

5. Start the backend:
   ```bash
   # For development with auto-reload
   make watch

   # Or just run it
   make run
   ```

### Frontend Setup

1. Open a new terminal and cd into the frontend directory:
   ```bash
   cd docker-manager-fe
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start the dev server:
   ```bash
   pnpm dev
   ```

4. Open your browser to `http://localhost:5173`

## Development Commands

### Backend
- `make watch` - Run with auto-reload (recommended for development)
- `make run` - Run without auto-reload
- `make test` - Run tests
- `make clean` - Clean up build files

### Frontend
- `pnpm dev` - Start dev server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build

## Project Structure

```
docker-manager/
├── cmd/                  # Application entry points
├── docker-manager-fe/    # Frontend app
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── hooks/      # Custom hooks
│   │   └── types/      # TypeScript types
│   ├── public/         # Static assets
│   └── index.html      # Entry HTML
├── internal/            # Backend code
│   ├── server/         # HTTP server & routes
│   ├── models/         # Data models
│   ├── service/        # Business logic
│   └── database/       # Database stuff
├── Makefile            # Build commands
└── go.mod             # Go dependencies
```

## What's Next?

- [ ] Add container networking setup
- [ ] Support for Docker volumes
- [ ] Environment variables management
- [ ] Container health monitoring
- [ ] Resource limits configuration
- [ ] Container backup/restore
- [ ] Better metrics visualization
- [ ] Log export functionality

## Contributing

Found a bug or have an idea for a feature? Feel free to:
1. Open an issue
2. Fork the repo
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this however you want!
