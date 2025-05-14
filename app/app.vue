<template>
  <NuxtLayout>
    <v-app>
      <v-app-bar>
        <v-app-bar-title>TCG Shadowbox Planner</v-app-bar-title>
        <v-spacer></v-spacer>
        <v-dialog v-model="dialog" width="600">
          <template v-slot:activator="{ props }">
            <v-btn icon v-bind="props">
              <v-icon>mdi-help-circle</v-icon>
            </v-btn>
          </template>
          <v-card>
            <v-card-title class="text-h5 pa-4"> Help Guide </v-card-title>
            <v-card-text class="pa-4">
              <v-list>
                <v-list-subheader>1. Upload Images</v-list-subheader>
                <v-list-item>
                  <v-list-item-text>
                    1. Click the upload button at the top of the page<br />
                    2. Select an image file from your computer<br />
                    3. Wait for the image to be uploaded
                  </v-list-item-text>
                </v-list-item>

                <v-list-subheader>2. Manage Layers</v-list-subheader>
                <v-list-item>
                  <v-list-item-text>
                    • Duplicate images using the copy icon<br />
                    • Move layers up/down using arrow buttons<br />
                    • Delete images using the trash icon<br />
                    • Click on any image to edit it
                  </v-list-item-text>
                </v-list-item>

                <v-list-subheader>3. Edit Images</v-list-subheader>
                <v-list-item>
                  <v-list-item-text>
                    1. Click on any image to open the editor<br />
                    2. Use the tools to cut and shape your image<br />
                    3. Click save when done
                  </v-list-item-text>
                </v-list-item>

                <v-list-subheader>4. Preview in 3D</v-list-subheader>
                <v-list-item>
                  <v-list-item-text>
                    1. Switch to the "3D View" tab<br />
                    2. View your stacked layers<br />
                    3. Use numbered buttons to highlight layers
                  </v-list-item-text>
                </v-list-item>

                <v-list-subheader>5. Export Your Design</v-list-subheader>
                <v-list-item>
                  <v-list-item-text>
                    1. Click the "Export PDF" button<br />
                    2. Save the PDF file<br />
                    3. Use it as your reference
                  </v-list-item-text>
                </v-list-item>
              </v-list>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="primary" variant="text" @click="dialog = false">
                Close
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-app-bar>
      <NuxtPage />
      <v-footer class="d-flex flex-column">
        <div class="px-4 py-2 text-center w-100">
          <div class="mb-2">
            <small class="text-disabled">v0.0.1-beta</small>
          </div>
          <div class="mb-2">
            <small class="text-disabled">
              This application is provided "as is" without warranty of any kind.
              Use at your own risk.
            </small>
          </div>
          <div>
            <span>&copy; 2025 katacom.jp</span>
          </div>
        </div>
      </v-footer>
    </v-app>
  </NuxtLayout>
</template>

<script setup>
const dialog = ref(false);

useHead({
  title: "TCG Shadowbox Planner",
  link: [
    {
      rel: "icon",
      type: "image/x-icon",
      href: "/TCG-Shadowbox-Planner/favicon.ico",
    },
  ],
  meta: [
    { charset: "utf-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    {
      name: "description",
      content:
        "TCGカードのシャドーボックスを簡単に設計できるWebアプリケーション",
    },
    // OGP基本設定
    { property: "og:type", content: "website" },
    { property: "og:title", content: "TCG Shadowbox Planner" },
    {
      property: "og:description",
      content:
        "TCGカードのシャドーボックスを簡単に設計できるWebアプリケーション",
    },
    { property: "og:site_name", content: "TCG Shadowbox Planner" },
    {
      property: "og:url",
      content: "https://shin1kt.github.io/TCG-Shadowbox-Planner/",
    },
    {
      property: "og:image",
      content: "https://shin1kt.github.io/TCG-Shadowbox-Planner/ogp.png",
    },
    // Twitter Card設定
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: "TCG Shadowbox Planner" },
    {
      name: "twitter:description",
      content:
        "TCGカードのシャドーボックスを簡単に設計できるWebアプリケーション",
    },
    {
      name: "twitter:image",
      content: "https://shin1kt.github.io/TCG-Shadowbox-Planner/ogp.png",
    },
  ],
});
</script>

<style scoped>
.v-list-item-text {
  white-space: pre-line;
}

.v-footer {
  background-color: rgb(var(--v-theme-surface));
}

.text-disabled {
  opacity: 0.7;
}
</style>
