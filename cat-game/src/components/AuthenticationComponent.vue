<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { User } from "@pwdgame/shared";
import LoginForm from "./LoginForm.vue"
import RegistrationForm from "./RegistrationForm.vue"
import PasswordResetForm from "./PasswordResetForm.vue"

@Component({
  components: {
    LoginForm,
    RegistrationForm,
    PasswordResetForm
  },
})
export default class AuthenticationComponent extends Vue {
  @Prop(Function)
  readonly setUserCallback?: (user: User) => void;

  loginType = 0; // 0 = login; 1 = register; 2 = password reset

  goToLogin() {
    this.loginType = 0;
  }

  goToRegister() {
    this.loginType = 1;
  }

  goToPasswordReset() {
    this.loginType = 2;
  }
}
</script>

<template>
  <div class="d-flex flex-column justify-content-center align-items-stretch" style="min-height: 100%">
    <h2 class="text-center">Cat Game!</h2>
    <div class="d-flex justify-content-center align-items-center">
      <transition name="fade" mode="out-in">
        <LoginForm v-if="loginType === 0" key="login"
                   :setUserCallback="setUserCallback" :registerCallback="goToRegister" :passwordResetCallback="goToPasswordReset" />
        <RegistrationForm v-if="loginType === 1" key="register"
                          :setUserCallback="setUserCallback" :cancelCallback="goToLogin" />
        <PasswordResetForm v-if="loginType === 2" key="pwdReset"
                           :setUserCallback="setUserCallback" :cancelCallback="goToLogin" />
      </transition>
    </div>
  </div>
</template>
