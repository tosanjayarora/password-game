<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { User, UserService } from "@pwdgame/shared";
import appSettings from "../../appsettings.json";
import avatars from "../assets/avatars/avatars";

@Component({
  components: {},
})
export default class PasswordResetForm extends Vue {
  constructor() {
    super();
    this.avatars = {};
    Object.keys(avatars)
      .filter(k => k.startsWith('cat'))
      .forEach(k => this.avatars[k] = avatars[k as keyof typeof avatars]);
  }

  @Prop(Function)
  readonly closeCallback?: () => void;

  @Prop({
    type: Object,
    required: true
  })
  readonly user?: User;
  readonly avatars: { [id: string] : string };

  pickerOpen = false;

  mounted() {
    if (!this.user?.avatarId) {
      this.pickerOpen = true;
    }
  }

  async pickAvatar(avatarId: string) {
    if (!this.user) return;
    const userService = new UserService(appSettings.backendApiBaseUrl);
    try {
      await userService.updateUser(this.user.username, { avatarId });
      this.user.avatarId = avatarId;
      this.pickerOpen = false;
    } catch (err) {
      if (err instanceof Error) {
        alert (err.message || "Pick avatar failed");
      } else {
        alert("Pick avatar failed unexpectedly.");
      }
    }
  }
}
</script>

<template>
  <b-modal v-model="pickerOpen" size="lg" hide-footer centered scrollable
           hide-header-close no-close-on-backdrop no-close-on-esc>
    <template #modal-title>
      Choose your cat-vatar
    </template>
    <div class="d-flex flex-wrap justify-content-center">
      <a class="d-block m-2" v-for="(file, id) in avatars" :key="id"
         href="#" @click.prevent="pickAvatar(id)">
        <img :src="require(`../assets/avatars/${file}`)"
             height="120" width="120" class="circle" />
      </a>
    </div>
  </b-modal>
</template>