import { WellnessData } from '../types/api.js';

export class WellnessForm {
    private container: HTMLElement;

    constructor(container: HTMLElement) {
        this.container = container;
    }

    public render(wellnessData?: WellnessData): void {
        if (!wellnessData) {
            this.renderEmptyState();
            return;
        }

        this.renderForm(wellnessData);
    }

    private renderEmptyState(): void {
        this.container.innerHTML = `
            <div class="empty-state">
                <h3>No wellness data</h3>
                <p>No wellness information available for this session.</p>
            </div>
        `;
    }

    private renderForm(data: WellnessData): void {
        const formHtml = `
            <div class="wellness-form">
                <div class="form-section">
                    <h4>Basic Information</h4>
                    <div class="form-grid">
                        <div class="form-field">
                            <label>Age</label>
                            <div class="field-value">${data.age || 'Not specified'}</div>
                        </div>
                        <div class="form-field">
                            <label>Weight</label>
                            <div class="field-value">${data.weight ? `${data.weight} kg` : 'Not specified'}</div>
                        </div>
                        <div class="form-field">
                            <label>Height</label>
                            <div class="field-value">${data.height ? `${data.height} cm` : 'Not specified'}</div>
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h4>Health Metrics</h4>
                    <div class="form-grid">
                        <div class="form-field">
                            <label>Stress Level</label>
                            <div class="field-value ${this.getStressClass(data.stress_level)}">
                                ${data.stress_level ? `${data.stress_level}/10` : 'Not specified'}
                                ${data.stress_level ? this.renderStressBar(data.stress_level) : ''}
                            </div>
                        </div>
                        <div class="form-field">
                            <label>Sleep Hours</label>
                            <div class="field-value">
                                ${data.sleep_hours ? `${data.sleep_hours} hours` : 'Not specified'}
                            </div>
                        </div>
                        <div class="form-field">
                            <label>Activity Level</label>
                            <div class="field-value activity-${data.activity_level?.toLowerCase()}">
                                ${data.activity_level || 'Not specified'}
                            </div>
                        </div>
                    </div>
                </div>

                ${data.goals && data.goals.length > 0 ? `
                <div class="form-section">
                    <h4>Goals</h4>
                    <div class="goals-list">
                        ${data.goals.map(goal => `
                            <span class="goal-tag">${this.formatGoal(goal)}</span>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                ${this.renderAdditionalFields(data)}
            </div>
        `;

        this.container.innerHTML = formHtml;
    }

    private renderStressBar(level: number): string {
        const percentage = (level / 10) * 100;
        return `
            <div class="stress-bar">
                <div class="stress-fill" style="width: ${percentage}%"></div>
            </div>
        `;
    }

    private getStressClass(level?: number): string {
        if (!level) return '';
        if (level <= 3) return 'stress-low';
        if (level <= 6) return 'stress-medium';
        return 'stress-high';
    }

    private formatGoal(goal: string): string {
        return goal.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    private renderAdditionalFields(data: WellnessData): string {
        const excludeFields = ['age', 'weight', 'height', 'stress_level', 'sleep_hours', 'activity_level', 'goals'];
        const additionalFields = Object.keys(data).filter(key => !excludeFields.includes(key));
        
        if (additionalFields.length === 0) return '';

        return `
            <div class="form-section">
                <h4>Additional Information</h4>
                <div class="form-grid">
                    ${additionalFields.map(key => `
                        <div class="form-field">
                            <label>${this.formatFieldName(key)}</label>
                            <div class="field-value">${this.formatFieldValue(data[key])}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    private formatFieldName(key: string): string {
        return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    private formatFieldValue(value: any): string {
        if (value === null || value === undefined) return 'Not specified';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
    }

}
