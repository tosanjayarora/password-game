<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { User, UserService } from "@pwdgame/shared";
import appSettings from "../../appsettings.json";

@Component
export default class RegistrationForm extends Vue {
  @Prop(Function)
  readonly setUserCallback?: (user: User) => void;

  @Prop(Function)
  readonly cancelCallback?: () => void;

  submitPending = false;

  username = "";
  securityPromptKey = "";
  securityPrompt = "";
  securityAnswer = "";
  password = "";
  confirmPassword = "";

  get isValidInput() {
    return this.username
      && this.securityAnswer
      && this.password
      && this.confirmPassword;
  }

  errorMsg = "";

  async created() {
    const questions = await new UserService(appSettings.backendApiBaseUrl).getSecurityQuestions();
    const rand = new Date().valueOf() % Object.keys(questions).length; // cheat way to get random index
    this.securityPromptKey = Object.keys(questions)[rand];
    this.securityPrompt = questions[this.securityPromptKey];
  }

  async tryUpdatePassword() {
    if (!this.isValidInput) {
      return;
    }
    this.errorMsg = "";
    if (this.password !== this.confirmPassword) {
      this.errorMsg = "Your passwords do not match."
      return;
    }

    this.submitPending = true;

    try {
      const user = await new UserService(appSettings.backendApiBaseUrl).resetPassword(
        this.username,
        this.securityPromptKey,
        this.securityAnswer,
        this.password
      );
      if (this.setUserCallback) this.setUserCallback(user);
    } catch (err) {
      if (err instanceof Error) {
        this.errorMsg = err.message || "Password reset failed.";
      } else {
        this.errorMsg = "Password reset failed unexpectedly.";
      }
    }
    this.submitPending = false;
  }
}
</script>

<style scoped>
.card {
  max-width: 800px;
}
</style>

<template>
  <div class="card flex-grow-1">
    <form class="card-body">
      <h3 class="card-title">Reset your password
        <button type="button" class="close" aria-label="Close" @click.prevent="cancelCallback">
          <span aria-hidden="true">&times;</span>
        </button>
      </h3>
      <transition name="fade">
        <p class="text-danger" v-if="errorMsg">{{ errorMsg }}</p>
      </transition>
      <div class="mb-3">
        <label class="form-label" for="username">Username</label>
        <input class="form-control" type="text" name="username" v-model="username" />
      </div>
      <div class="mb-3">
        <label class="form-label" for="securityAnswer">{{ securityPrompt }}</label>
        <input class="form-control" type="text" name="securityAnswer" v-model="securityAnswer" />
      </div>
      <div class="row mb-3">
        <div class="col-md">
          <label class="form-label" for="password">Password</label>
          <input class="form-control" type="password" name="password" v-model="password" />
        </div>
        <div class="col-md">
          <label class="form-label" for="confirmPassword">Re-enter your password</label>
          <input class="form-control" type="password" name="confirmPassword" v-model="confirmPassword" />
        </div>
      </div>
      <button type="submit" class="btn btn-primary" style="width:12em"
              :disabled="!isValidInput && !submitPending" @click.prevent="tryUpdatePassword">
        <b-spinner v-if="submitPending" label="Loading" variant="light" small />
        <span v-if="!submitPending">Reset password</span>
      </button>
    </form>
  </div>
</template>
