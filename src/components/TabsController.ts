export class TabsController {
    private container: HTMLElement;
    private currentTab: string = 'summary';

    constructor(container: HTMLElement) {
        this.container = container;
        this.init();
    }

    private init(): void {
        this.bindTabEvents();
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


    public switchTab(tabName: string): void {
        // Update tab buttons
        const tabBtns = this.container.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-tab') === tabName) {
                btn.classList.add('active');
                // Remove update indicator when switching to this tab
                btn.classList.remove('has-updates');
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


    public getCurrentTab(): string {
        return this.currentTab;
    }
}
