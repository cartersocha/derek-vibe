"use client";

import Link from 'next/link';
import { useState } from 'react';
import { getPillClasses, getDashedPillClasses, cn } from '@/lib/utils';

interface SessionRelatedGroupsProps {
  sessionId: string;
  groups: Array<{
    id: string;
    name: string;
  }>;
}

export function SessionRelatedGroups({ sessionId, groups }: SessionRelatedGroupsProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleSessionGroups = (id: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  if (groups.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h3 className="text-xl font-bold text-[var(--cyber-cyan)] mb-4 uppercase tracking-wider">Related Groups</h3>
      <div className="flex flex-wrap gap-2">
        {(expandedGroups.has(sessionId) 
          ? groups 
          : groups.slice(0, 6)
        ).map((group) => (
          <Link
            key={group.id}
            href={`/organizations/${group.id}`}
            className={getPillClasses('organization', 'small')}
          >
            {group.name}
          </Link>
        ))}
        {!expandedGroups.has(sessionId) && groups.length > 6 && (
          <button
            onClick={() => toggleSessionGroups(sessionId)}
            className={cn(getDashedPillClasses('organization', 'small'), 'whitespace-nowrap')}
            aria-label={`Show ${groups.length - 6} more groups`}
          >
            +{groups.length - 6} more
          </button>
        )}
        {expandedGroups.has(sessionId) && groups.length > 6 && (
          <button
            onClick={() => toggleSessionGroups(sessionId)}
            className={cn(getPillClasses('default', 'small'), 'whitespace-nowrap')}
            aria-label="Show fewer groups"
          >
            Show less
          </button>
        )}
      </div>
    </div>
  );
}
