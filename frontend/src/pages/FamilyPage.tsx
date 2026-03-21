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
    <div className="max-w-[900px] mx-auto px-5 py-8">
      <div className="flex justify-between items-center mb-7">
        <div>
          <h1 className="font-display text-[1.8rem] font-medium text-brand-dark">
            My Family
          </h1>
          <p className="text-muted mt-1">
            {members?.length ?? 0} family member{members?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setAdding(true)}>+ Add Member</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-[60px]"><Spinner size={36} /></div>
      ) : members?.length === 0 ? (
        <div className="text-center py-[60px] px-5 bg-surface rounded-lg border-[1.5px] border-border">
          <div className="text-[3.5rem] mb-3">👨‍👩‍👧‍👦</div>
          <h3 className="font-display">No family members yet</h3>
          <p className="text-muted mt-2 mb-5">
            Add the members of your foster family to your profile.
          </p>
          <Button onClick={() => setAdding(true)}>+ Add First Member</Button>
        </div>
      ) : (
        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
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
