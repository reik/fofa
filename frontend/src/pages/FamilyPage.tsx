import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { familyService } from '../services';
import { FamilyMemberCard, FamilyMemberForm } from '../components/family/FamilyMemberCard';
import { Button, Spinner } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';

export const FamilyPage: React.FC = () => {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);

  const { data: members, isLoading } = useQuery({
    queryKey: ['family'],
    queryFn: familyService.getAll,
  });

  const handleUpdate = () => qc.invalidateQueries({ queryKey: ['family'] });

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 500, color: 'var(--c-brand-dark)' }}>
            My Family
          </h1>
          <p style={{ color: 'var(--c-text-muted)', marginTop: 4 }}>
            {members?.length ?? 0} family member{members?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setAdding(true)}>+ Add Member</Button>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={36} /></div>
      ) : members?.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: 'var(--c-surface)', borderRadius: 'var(--radius-lg)',
          border: '1.5px solid var(--c-border)',
        }}>
          <div style={{ fontSize: '3.5rem', marginBottom: 12 }}>👨‍👩‍👧‍👦</div>
          <h3 style={{ fontFamily: 'var(--font-display)' }}>No family members yet</h3>
          <p style={{ color: 'var(--c-text-muted)', marginTop: 8, marginBottom: 20 }}>
            Add the members of your foster family to your profile.
          </p>
          <Button onClick={() => setAdding(true)}>+ Add First Member</Button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 20,
        }}>
          {members?.map(member => (
            <FamilyMemberCard key={member.id} member={member} onUpdate={handleUpdate} />
          ))}
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Add Family Member">
        <FamilyMemberForm onSaved={() => { setAdding(false); handleUpdate(); }} onCancel={() => setAdding(false)} />
      </Modal>
    </div>
  );
};
