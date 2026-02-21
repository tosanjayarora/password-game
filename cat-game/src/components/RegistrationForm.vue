<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { User, UserService } from "@pwdgame/shared";
import appSettings from "../../appsettings.json";

@Component({
  components: {},
})
export default class PasswordResetForm extends Vue {
  @Prop(Function)
  readonly setUserCallback?: (user: User) => void;

  @Prop(Function)
  readonly cancelCallback?: () => void;

  submitPending = false;

  securityPrompts = {} as { [key: string]: string };

  username = "";
  password = "";
  confirmPassword = "";
  securityAnswers = {} as { [key: string]: string };

  get isValidInput() {
    return this.username
      && this.password
      && this.confirmPassword
      && Object.keys(this.securityAnswers).every(k => this.securityAnswers[k]);
  }

  errorMsg = "";

  async created() {
    this.securityPrompts = await new UserService(appSettings.backendApiBaseUrl).getSecurityQuestions();
    Object.keys(this.securityAnswers).forEach(k => this.securityAnswers[k] = "")
  }

  async tryRegister() {
    if (!this.isValidInput) {
      return;
    }
    this.errorMsg = "";
    if (this.password !== this.confirmPassword) {
      this.errorMsg = "Your passwords do not match."
      return;
    }

    this.submitPending = true;
    const userService = new UserService(appSettings.backendApiBaseUrl);
    const user: User = {
      username: this.username,
    };
    try {
      await userService.createUser(user, this.password, this.securityAnswers);
      if (this.setUserCallback) this.setUserCallback(user);
    } catch (err) {
      if (err instanceof Error) {
        this.errorMsg = err.message || "Registration failed.";
      } else {
        this.errorMsg = "Registration failed unexpectedly."
      }
    }
    this.submitPending = false;
  }
}
</script>

<template>
  <div class="card flex-grow-1">
    <form class="card-body">
      <h3 class="card-title">Create a new account
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
      <p class="lead">In case you forget your password, we can use this information to reset it:</p>
      <div class="mb-3" v-for="(prompt, key) in securityPrompts" :key="key">
        <label class="form-label" :for="'ans_' + key">{{ prompt }}</label>
        <input class="form-control" type="text" :name="'ans_' + key" v-model="securityAnswers[key]" />
      </div>
      <button type="submit" class="btn btn-primary" style="width:12em"
              :disabled="!isValidInput && !submitPending" @click.prevent="tryRegister">
        <b-spinner v-if="submitPending" label="Loading" variant="light" small />
        <span v-if="!submitPending">Create account</span>
      </button>
    </form>
  </div>
</template>
