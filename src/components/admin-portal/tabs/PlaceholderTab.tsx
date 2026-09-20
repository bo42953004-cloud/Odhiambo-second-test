import React from 'react';

type Props = { title: string; icon: string; description: string };

const PlaceholderTab: React.FC<Props> = ({ title, icon, description }) => (
    <div className='admin-tab__placeholder'>
        <div className='placeholder-content'>
            <div className='placeholder-icon'>{icon}</div>
            <h2 className='placeholder-title'>{title}</h2>
            <p className='placeholder-desc'>{description}</p>
            <div className='placeholder-coming-soon'>Coming Soon</div>
        </div>
    </div>
);

export default PlaceholderTab;
