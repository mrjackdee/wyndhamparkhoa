import type { CollectionConfig } from 'payload';
import { nobody, permit } from '../lib/access';
export const Reconciliations: CollectionConfig = {
  slug: 'reconciliations', labels: { singular: 'Duplicate review', plural: 'Review Possible Duplicates' },
  admin: { group: 'Private records', useAsTitle: 'decision', components: { views: { list: { Component: '@/components/DuplicateWorkspace#default' } } } },
  access: { create: nobody, read: permit('residents.reconcile'), update: nobody, delete: nobody },
  fields: [
    { name: 'decision', type: 'select', options: ['separate', 'merged', 'recovered'], required: true },
    { name: 'source', type: 'relationship', relationTo: 'residents', required: true },
    { name: 'target', type: 'relationship', relationTo: 'residents', required: true },
    { name: 'actor', type: 'text', required: true },
    { name: 'reason', label: 'Review decision and preference evidence', type: 'textarea', required: true },
    { name: 'snapshot', type: 'json', admin: { hidden: true } },
    { name: 'resultVersions', type: 'json', admin: { hidden: true } },
    { name: 'recoveredAt', type: 'date' },
    { name: 'recoveredBy', type: 'text' },
  ],
};
