<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { User } from "@pwdgame/shared";
import LoginForm from "./LoginForm.vue"

@Component({
  components: {
    LoginForm
  },
})
export default class AuthenticationComponent extends Vue {
  @Prop(Function)
  readonly setUserCallback?: (user: User) => void;
}
</script>

<template>
  <div class="d-flex flex-column justify-content-center align-items-stretch" style="min-height: 100%">
    <h2 class="text-center">Get cool dog avatars for Cat Chat!</h2>
    <div class="d-flex justify-content-center my-2">
      <img src="../assets/dog1.jpg" height="120" width="120" class="circle mx-3" />
      <img src="../assets/dog2.jpg" height="120" width="120" class="circle mx-3" />
      <img src="../assets/dog3.jpg" height="120" width="120" class="circle mx-3" />
    </div>
    <div class="d-flex justify-content-center align-items-center">
      <LoginForm :setUserCallback="setUserCallback" />
    </div>
  </div>
</template>
