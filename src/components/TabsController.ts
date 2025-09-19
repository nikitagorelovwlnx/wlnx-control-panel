export class TabsController {
    private container: HTMLElement;
    private currentTab: string = 'summary';

    constructor(container: HTMLElement) {
        this.container = container;
        this.init();
    }

    private init(): void {
        this.bindTabEvents();
        this.bindCollapseEvents();
    }

    private bindTabEvents(): void {
        const tabBtns = this.container.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = (e.target as HTMLElement).getAttribute('data-tab');
                if (tabName) {
                    this.switchTab(tabName);
                }
            });
        });
    }

    private bindCollapseEvents(): void {
        const collapseBtns = this.container.querySelectorAll('.collapse-tab-btn');
        collapseBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabContent = (e.target as HTMLElement).closest('.tab-content');
                if (tabContent) {
                    this.toggleTabCollapse(tabContent as HTMLElement);
                }
            });
        });
    }

    public switchTab(tabName: string): void {
        // Update tab buttons
        const tabBtns = this.container.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-tab') === tabName) {
                btn.classList.add('active');
            }
        });

        // Update tab content
        const tabContents = this.container.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            content.classList.remove('active');
        });

        const activeTab = this.container.querySelector(`#tab-${tabName}`);
        if (activeTab) {
            activeTab.classList.add('active');
        }

        this.currentTab = tabName;
    }

    private toggleTabCollapse(tabContent: HTMLElement): void {
        const isCollapsed = tabContent.classList.contains('collapsed');
        const collapseBtn = tabContent.querySelector('.collapse-tab-btn') as HTMLElement;
        
        if (isCollapsed) {
            tabContent.classList.remove('collapsed');
            if (collapseBtn) collapseBtn.textContent = '↑';
        } else {
            tabContent.classList.add('collapsed');
            if (collapseBtn) collapseBtn.textContent = '↓';
        }
    }

    public getCurrentTab(): string {
        return this.currentTab;
    }
}
