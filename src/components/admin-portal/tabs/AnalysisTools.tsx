import React, { useState } from 'react';
import { useAdminPortal, TAnalysisTool } from '../AdminPortalContext';

const AnalysisTools: React.FC = () => {
    const { settings, updateSettings } = useAdminPortal();
    const [isAdding, setIsAdding] = useState(false);
    const [newTool, setNewTool] = useState<Partial<TAnalysisTool>>({ icon: '🔧' });

    const addTool = () => {
        if (!newTool.name || !newTool.url) return;
        const tool: TAnalysisTool = {
            id: Date.now().toString(),
            name: newTool.name || '',
            description: newTool.description || '',
            url: newTool.url || '',
            icon: newTool.icon || '🔧',
        };
        updateSettings({ analysisTools: [...settings.analysisTools, tool] });
        window.dispatchEvent(new Event('admin_settings_updated'));
        setNewTool({ icon: '🔧' });
        setIsAdding(false);
    };

    const removeTool = (id: string) => {
        updateSettings({ analysisTools: settings.analysisTools.filter(t => t.id !== id) });
        window.dispatchEvent(new Event('admin_settings_updated'));
    };

    return (
        <div className='admin-tab__analysis'>
            <div className='admin-tab__header'>
                <h2 className='admin-tab__title'>Manage Analysis Tools</h2>
                <p className='admin-tab__subtitle'>
                    Tools appear on the <strong>Analysis Tools</strong> tab visible to all users, loaded as iframes inside the site.
                </p>
            </div>

            <div className='analysis-tools__grid'>
                {settings.analysisTools.map(tool => (
                    <div key={tool.id} className='tool-card'>
                        <div className='tool-card__icon'>{tool.icon}</div>
                        <div className='tool-card__body'>
                            <h3 className='tool-card__name'>{tool.name}</h3>
                            <p className='tool-card__desc'>{tool.description}</p>
                            <span className='tool-card__url'>{tool.url}</span>
                        </div>
                        <div className='tool-card__actions'>
                            <button className='tool-card__btn tool-card__btn--remove' onClick={() => removeTool(tool.id)}>
                                Remove
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {!isAdding ? (
                <button className='analysis-tools__add-btn' onClick={() => setIsAdding(true)}>
                    + Add Analysis Tool
                </button>
            ) : (
                <div className='analysis-tools__form'>
                    <h3 className='analysis-tools__form-title'>Add Analysis Tool</h3>
                    <div className='admin-form__row'>
                        <label>Icon (emoji)</label>
                        <input value={newTool.icon || ''} onChange={e => setNewTool(p => ({ ...p, icon: e.target.value }))} placeholder='🔧' maxLength={4} />
                    </div>
                    <div className='admin-form__row'>
                        <label>Tool Name *</label>
                        <input value={newTool.name || ''} onChange={e => setNewTool(p => ({ ...p, name: e.target.value }))} placeholder='e.g. RSI Calculator' />
                    </div>
                    <div className='admin-form__row'>
                        <label>Description</label>
                        <input value={newTool.description || ''} onChange={e => setNewTool(p => ({ ...p, description: e.target.value }))} placeholder='Short description of this tool' />
                    </div>
                    <div className='admin-form__row'>
                        <label>URL * (will be loaded as iframe)</label>
                        <input value={newTool.url || ''} onChange={e => setNewTool(p => ({ ...p, url: e.target.value }))} placeholder='https://...' type='url' />
                    </div>
                    <div className='analysis-tools__form-actions'>
                        <button className='admin-btn admin-btn--primary' onClick={addTool}>Add Tool</button>
                        <button className='admin-btn admin-btn--ghost' onClick={() => setIsAdding(false)}>Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalysisTools;
