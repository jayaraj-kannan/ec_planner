<script setup lang="ts">
import { ref } from 'vue';
import {
  currentEvent,
  eventDocuments,
} from '../../stores/eventStore';
import type { DocumentItem } from '../../types/event';
import {
  FileText,
  Download,
  Eye,
  FileCheck,
  X,
  FileUp,
} from 'lucide-vue-next';

const previewDoc = ref<DocumentItem | null>(null);

function openPreview(doc: DocumentItem) {
  previewDoc.value = doc;
}

function closePreview() {
  previewDoc.value = null;
}
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 24px">
    <!-- Header -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px">
      <div>
        <h2 style="font-size: 1.6rem">Document Vault & Attachments</h2>
        <p style="font-size: 0.88rem; color: var(--text-muted)">
          Section 6.9: Master venue contracts, floor plans, catering tasting blueprints, invoices, and invitation assets.
        </p>
      </div>

      <button
        class="btn btn-primary"
        @click="openPreview(eventDocuments[0])"
      >
        <FileUp :size="16" />
        <span>+ Upload Document</span>
      </button>
    </div>

    <!-- Documents Grid -->
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 18px">
      <div
        v-for="doc in eventDocuments"
        :key="doc.id"
        class="card"
        style="display: flex; flex-direction: column; justify-content: space-between"
      >
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px">
            <span
              class="badge"
              :class="{
                'badge-success': doc.category === 'Contract',
                'badge-info': doc.category === 'Floorplan' || doc.category === 'Design',
                'badge-warning': doc.category === 'Invoice',
                'badge-neutral': doc.category === 'Invite',
              }"
            >
              {{ doc.category.toUpperCase() }}
            </span>
            <span style="font-size: 0.75rem; color: var(--text-muted)">{{ doc.fileSize }}</span>
          </div>

          <div style="display: flex; align-items: flex-start; gap: 12px">
            <div
              style="
                width: 40px;
                height: 40px;
                border-radius: var(--radius-md);
                background: var(--primary-light);
                color: var(--primary);
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
              "
            >
              <FileText :size="20" />
            </div>

            <div>
              <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-main); line-height: 1.3">
                {{ doc.title }}
              </h3>
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px">
                Uploaded: {{ doc.uploadDate }} • Authorized Cloud File
              </div>
            </div>
          </div>
        </div>

        <div style="display: flex; gap: 8px; border-top: 1px solid var(--surface-border); padding-top: 14px; margin-top: 16px">
          <button
            class="btn btn-outline btn-sm"
            style="flex: 1"
            @click="openPreview(doc)"
          >
            <Eye :size="14" />
            <span>Preview</span>
          </button>

          <button
            class="btn btn-secondary btn-sm"
            @click="openPreview(doc)"
          >
            <Download :size="14" />
            <span>Download</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Document Preview Modal -->
    <div v-if="previewDoc" class="modal-overlay" @click.self="closePreview">
      <div class="modal-box">
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: 10px">
            <FileCheck :size="20" style="color: var(--primary)" />
            <span style="font-weight: 700; font-size: 1rem">{{ previewDoc.title }}</span>
          </div>
          <button class="btn-icon" @click="closePreview">
            <X :size="18" />
          </button>
        </div>

        <div class="modal-body" style="text-align: center; padding: 36px 20px">
          <div
            style="
              width: 70px;
              height: 70px;
              border-radius: 50%;
              background: var(--primary-light);
              color: var(--primary);
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 16px;
            "
          >
            <FileText :size="36" />
          </div>

          <h3 style="font-size: 1.25rem; color: var(--text-main); margin-bottom: 6px">
            {{ previewDoc.title }}
          </h3>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 20px">
            Category: {{ previewDoc.category }} • File Size: {{ previewDoc.fileSize }} • Signed & Verified
          </p>

          <div
            style="
              background: var(--surface-subtle);
              border-radius: var(--radius-md);
              padding: 16px;
              text-align: left;
              font-family: monospace;
              font-size: 0.8rem;
              color: var(--text-muted);
              border: 1px solid var(--surface-border);
              line-height: 1.6;
            "
          >
            --- MOCK CLOUD STORAGE PREVIEW ---<br />
            EVENT ID: {{ currentEvent.id }}<br />
            DOCUMENT: {{ previewDoc.title }}<br />
            VERIFICATION: SHA-256 HMAC Verified<br />
            STORAGE PATH: gs://ec-planner-artifacts/documents/{{ previewDoc.id }}.pdf<br />
            ENCRYPTION: Google Cloud KMS AES-256
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closePreview">Close</button>
          <button class="btn btn-primary" @click="closePreview">Download Copy</button>
        </div>
      </div>
    </div>
  </div>
</template>
