import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAdminLanguage } from '../../../context/AdminLanguageContext';
import './AdminHub.css';

/**
 * Unified 1-click tabbed workspace wrapper.
 * Combines closely related admin pages under one clean navigation bar synced with ?tab=
 */
const AdminHub = ({ tabs, defaultTab }) => {
    const { isAmharic } = useAdminLanguage();
    const [searchParams, setSearchParams] = useSearchParams();

    const requestedTab = searchParams.get('tab');
    const validIds = tabs.map((t) => t.id);
    const activeTab = validIds.includes(requestedTab)
        ? requestedTab
        : defaultTab || tabs[0]?.id;

    const current = tabs.find((t) => t.id === activeTab) || tabs[0];

    const handleSelect = (tabId) => {
        const next = new URLSearchParams(searchParams);
        next.set('tab', tabId);
        // Clean child sub-tab param when switching top-level hub tab
        if (tabId !== activeTab) next.delete('view');
        setSearchParams(next, { replace: true });
    };

    return (
        <div className="admin-hub">
            <div className="admin-hub-bar-wrap">
                <div className="admin-hub-bar" role="tablist">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = tab.id === activeTab;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                                className={`admin-hub-tab ${isActive ? 'active' : ''}`}
                                onClick={() => handleSelect(tab.id)}
                            >
                                {Icon && <Icon size={16} />}
                                <span>{isAmharic ? tab.am : tab.en}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="admin-hub-body" key={current.id}>
                {current.render ? current.render() : <current.component />}
            </div>
        </div>
    );
};

export default AdminHub;
