export class PanelResizer {
    private container: HTMLElement;
    private resizers: Map<string, HTMLElement> = new Map();
    private isDragging = false;
    private currentResizer: HTMLElement | null = null;
    private startX = 0;
    private startY = 0;
    private startWidths: number[] = [];
    private startHeights: number[] = [];

    constructor(container: HTMLElement) {
        this.container = container;
        this.init();
    }

    private init(): void {
        this.setupResizers();
        this.bindEvents();
    }

    private setupResizers(): void {
        // Horizontal resizers
        const resizer1 = document.getElementById('resizer-1');
        const resizer2 = document.getElementById('resizer-2');
        const resizerVertical = document.getElementById('resizer-vertical');

        if (resizer1) this.resizers.set('horizontal-1', resizer1);
        if (resizer2) this.resizers.set('horizontal-2', resizer2);
        if (resizerVertical) this.resizers.set('vertical', resizerVertical);
    }

    private bindEvents(): void {
        // Mouse events
        this.resizers.forEach((resizer) => {
            resizer.addEventListener('mousedown', this.handleMouseDown.bind(this));
        });

        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));

        // Touch events for mobile
        this.resizers.forEach((resizer) => {
            resizer.addEventListener('touchstart', this.handleTouchStart.bind(this));
        });

        document.addEventListener('touchmove', this.handleTouchMove.bind(this));
        document.addEventListener('touchend', this.handleTouchEnd.bind(this));
    }

    private handleMouseDown(e: MouseEvent): void {
        e.preventDefault();
        this.startDragging(e.target as HTMLElement, e.clientX, e.clientY);
    }

    private handleTouchStart(e: TouchEvent): void {
        e.preventDefault();
        const touch = e.touches[0];
        this.startDragging(e.target as HTMLElement, touch.clientX, touch.clientY);
    }

    private startDragging(target: HTMLElement, clientX: number, clientY: number): void {
        const resizer = target.closest('.panel-resizer') as HTMLElement;
        if (!resizer) return;

        this.isDragging = true;
        this.currentResizer = resizer;
        this.startX = clientX;
        this.startY = clientY;

        // Add dragging class
        resizer.classList.add('dragging');
        document.body.style.cursor = resizer.classList.contains('vertical') ? 'row-resize' : 'col-resize';
        document.body.style.userSelect = 'none';

        // Store initial dimensions
        this.storeInitialDimensions();
    }

    private storeInitialDimensions(): void {
        const panels = this.container.querySelectorAll('.panel.active');
        this.startWidths = Array.from(panels).map(panel => (panel as HTMLElement).offsetWidth);
        
        // For vertical resizer, store heights of summary and transcript sections
        const summarySection = document.getElementById('summary-section');
        const transcriptSection = document.getElementById('transcript-section');
        
        if (summarySection && transcriptSection) {
            this.startHeights = [summarySection.offsetHeight, transcriptSection.offsetHeight];
        }
    }

    private handleMouseMove(e: MouseEvent): void {
        if (!this.isDragging) return;
        this.updatePanelSizes(e.clientX, e.clientY);
    }

    private handleTouchMove(e: TouchEvent): void {
        if (!this.isDragging) return;
        const touch = e.touches[0];
        this.updatePanelSizes(touch.clientX, touch.clientY);
    }

    private updatePanelSizes(clientX: number, clientY: number): void {
        if (!this.currentResizer) return;

        const resizerId = this.currentResizer.id;
        const isVertical = this.currentResizer.classList.contains('vertical');

        if (isVertical) {
            this.handleVerticalResize(clientY);
        } else {
            this.handleHorizontalResize(clientX, resizerId);
        }
    }

    private handleHorizontalResize(clientX: number, resizerId: string): void {
        const deltaX = clientX - this.startX;
        const containerWidth = this.container.offsetWidth;
        
        const usersPanel = document.getElementById('users-panel') as HTMLElement;
        const sessionsPanel = document.getElementById('sessions-panel') as HTMLElement;
        const detailsPanel = document.getElementById('details-panel') as HTMLElement;

        if (resizerId === 'resizer-1' && sessionsPanel.classList.contains('active')) {
            // Resize between users and sessions panels
            const newUsersWidth = Math.max(200, Math.min(containerWidth - 400, this.startWidths[0] + deltaX));
            const newSessionsWidth = containerWidth - newUsersWidth - (detailsPanel.classList.contains('active') ? this.startWidths[2] : 0);

            usersPanel.style.width = `${newUsersWidth}px`;
            sessionsPanel.style.width = `${newSessionsWidth}px`;

        } else if (resizerId === 'resizer-2' && detailsPanel.classList.contains('active')) {
            // Resize between sessions and details panels
            const activeWidth = containerWidth - (this.startWidths[2] || 0);
            const newSessionsWidth = Math.max(200, Math.min(activeWidth - 200, this.startWidths[1] + deltaX));
            const newDetailsWidth = containerWidth - this.startWidths[0] - newSessionsWidth;

            sessionsPanel.style.width = `${newSessionsWidth}px`;
            detailsPanel.style.width = `${newDetailsWidth}px`;
        }
    }

    private handleVerticalResize(clientY: number): void {
        const deltaY = clientY - this.startY;
        const summarySection = document.getElementById('summary-section') as HTMLElement;
        const transcriptSection = document.getElementById('transcript-section') as HTMLElement;
        
        if (!summarySection || !transcriptSection) return;

        const containerHeight = summarySection.parentElement!.offsetHeight;
        const newSummaryHeight = Math.max(100, Math.min(containerHeight - 100, this.startHeights[0] + deltaY));
        const newTranscriptHeight = containerHeight - newSummaryHeight;

        summarySection.style.height = `${newSummaryHeight}px`;
        transcriptSection.style.height = `${newTranscriptHeight}px`;
        
        // Update flex properties
        summarySection.style.flex = 'none';
        transcriptSection.style.flex = 'none';
    }

    private handleMouseUp(): void {
        this.stopDragging();
    }

    private handleTouchEnd(): void {
        this.stopDragging();
    }

    private stopDragging(): void {
        if (!this.isDragging) return;

        this.isDragging = false;
        
        if (this.currentResizer) {
            this.currentResizer.classList.remove('dragging');
            this.currentResizer = null;
        }

        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }

    public showResizers(): void {
        const sessionsPanel = document.getElementById('sessions-panel');
        const detailsPanel = document.getElementById('details-panel');

        // Show resizer between users and sessions if sessions panel is active
        const resizer1 = this.resizers.get('horizontal-1');
        if (resizer1 && sessionsPanel?.classList.contains('active')) {
            resizer1.classList.add('active');
        }

        // Show resizer between sessions and details if details panel is active
        const resizer2 = this.resizers.get('horizontal-2');
        if (resizer2 && detailsPanel?.classList.contains('active')) {
            resizer2.classList.add('active');
        }

        // Show vertical resizer in details panel
        const resizerVertical = this.resizers.get('vertical');
        if (resizerVertical && detailsPanel?.classList.contains('active')) {
            resizerVertical.classList.add('active');
        }
    }

    public hideResizers(): void {
        this.resizers.forEach(resizer => {
            resizer.classList.remove('active');
        });
    }

    public resetPanelSizes(): void {
        const usersPanel = document.getElementById('users-panel') as HTMLElement;
        const sessionsPanel = document.getElementById('sessions-panel') as HTMLElement;
        const detailsPanel = document.getElementById('details-panel') as HTMLElement;
        const summarySection = document.getElementById('summary-section') as HTMLElement;
        const transcriptSection = document.getElementById('transcript-section') as HTMLElement;

        // Reset horizontal panel sizes
        [usersPanel, sessionsPanel, detailsPanel].forEach(panel => {
            if (panel) {
                panel.style.width = '';
            }
        });

        // Reset vertical sections
        [summarySection, transcriptSection].forEach(section => {
            if (section) {
                section.style.height = '';
                section.style.flex = '';
            }
        });
    }
}
