import React, { useState } from 'react';
import { useAdminPortal, TCustomBlock } from '../AdminPortalContext';

const generateId = () => `blk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

function extractBlockNames(code: string): string[] {
    const matches = [...code.matchAll(/Blockly\.Blocks\.(\w+)\s*=/g)];
    return matches.map(m => m[1]);
}

function tryRegisterBlock(code: string): { ok: boolean; names: string[]; error?: string } {
    try {
        const names = extractBlockNames(code);
        if (names.length === 0) return { ok: false, names: [], error: 'No Blockly.Blocks.xxx = {...} definition found in the code.' };
        // Execute the code in global scope so Blockly picks it up
        // eslint-disable-next-line no-new-func
        new Function(code)();
        return { ok: true, names };
    } catch (err: any) {
        return { ok: false, names: [], error: err.message };
    }
}

const BlockLibrary: React.FC = () => {
    const { settings, updateSettings } = useAdminPortal();
    const blocks: TCustomBlock[] = settings.customBlocks || [];

    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const fileRef = React.useRef<HTMLInputElement>(null);

    const handleRegister = () => {
        setError('');
        setSuccess('');
        if (!code.trim()) { setError('Paste or upload block JS code first.'); return; }
        const result = tryRegisterBlock(code);
        if (!result.ok) { setError(result.error || 'Failed to register block.'); return; }
        const blockName = name.trim() || result.names.join(', ');
        const newBlock: TCustomBlock = { id: generateId(), name: blockName, code };
        updateSettings({ customBlocks: [...blocks, newBlock] });
        setSuccess(`✓ Registered: ${result.names.join(', ')}`);
        setCode('');
        setName('');
    };

    const handleDelete = (id: string) => {
        updateSettings({ customBlocks: blocks.filter(b => b.id !== id) });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            const content = ev.target?.result as string;
            setCode(content);
            setName(file.name.replace(/\.js$/i, ''));
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    return (
        <div className='admin-tab__block-library'>
            <div className='admin-tab__header'>
                <h2 className='admin-tab__title'>Block Library</h2>
                <p className='admin-tab__subtitle'>
                    Upload custom Blockly block definitions so bots that use them load correctly.
                </p>
            </div>

            <div className='block-lib__how-to'>
                <details>
                    <summary>How to use</summary>
                    <ol>
                        <li>Paste JS code that defines one or more <code>Blockly.Blocks.xxx = &#123; init() &#123;...&#125; &#125;</code> blocks.</li>
                        <li>Or upload a <code>.js</code> file from your computer.</li>
                        <li>Click <strong>Register Block</strong>. The block is saved globally and loaded on every page visit.</li>
                        <li>Bots that previously failed to import because of missing block types will now load.</li>
                    </ol>
                </details>
            </div>

            <div className='block-lib__form'>
                <div className='admin-form__row'>
                    <label>Label (optional)</label>
                    <input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder='e.g. my_custom_indicator'
                    />
                </div>

                <div className='admin-form__row'>
                    <label>Block JS Code</label>
                    <textarea
                        value={code}
                        onChange={e => { setCode(e.target.value); setError(''); setSuccess(''); }}
                        placeholder={`Blockly.Blocks.my_block = {\n  init() {\n    this.appendDummyInput().appendField("My Block");\n    this.setPreviousStatement(true, null);\n    this.setNextStatement(true, null);\n    this.setColour(180);\n  }\n};\n\nBlockly.JavaScript.javascriptGenerator.forBlock.my_block = block => {\n  return '// my block\\n';\n};`}
                        rows={12}
                        className='block-lib__code-area'
                        spellCheck={false}
                    />
                </div>

                <div className='block-lib__actions'>
                    <button className='admin-btn admin-btn--secondary' onClick={() => fileRef.current?.click()}>
                        📁 Upload .js File
                    </button>
                    <input ref={fileRef} type='file' accept='.js' style={{ display: 'none' }} onChange={handleFileUpload} />
                    <button className='admin-btn admin-btn--primary' onClick={handleRegister}>
                        ⚡ Register Block
                    </button>
                </div>

                {error && <p className='block-lib__error'>⚠ {error}</p>}
                {success && <p className='block-lib__success'>{success}</p>}
            </div>

            <div className='block-lib__list'>
                <h3 className='block-lib__list-title'>Registered Custom Blocks ({blocks.length})</h3>
                {blocks.length === 0 ? (
                    <p className='block-lib__empty'>No custom blocks registered yet.</p>
                ) : (
                    <div className='block-lib__items'>
                        {blocks.map(b => (
                            <div key={b.id} className='block-lib__item'>
                                <div className='block-lib__item-info'>
                                    <span className='block-lib__item-icon'>🧩</span>
                                    <div>
                                        <strong className='block-lib__item-name'>{b.name}</strong>
                                        <span className='block-lib__item-types'>
                                            {extractBlockNames(b.code).join(', ') || 'unknown'}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    className='admin-btn admin-btn--danger admin-btn--sm'
                                    onClick={() => handleDelete(b.id)}
                                    title='Remove block'
                                >
                                    🗑
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlockLibrary;
