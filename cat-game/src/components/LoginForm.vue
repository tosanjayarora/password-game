<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { User, UserService } from "@pwdgame/shared";
import appSettings from "../../appsettings.json";

@Component({
  components: {},
})
export default class LoginForm extends Vue {
  @Prop(Function)
  readonly setUserCallback?: (user: User) => void;
  @Prop(Function)
  readonly registerCallback?: () => void;
  @Prop(Function)
  readonly passwordResetCallback?: () => void;

  submitPending = false;

  username = "";
  password = "";

  get isValidInput() {
    return this.username && this.password;
  }

  errorMsg = "";

  async tryLogin() {
    if (!this.isValidInput) {
      return
    }
    this.submitPending = true;
    this.errorMsg = "";
    const userService = new UserService(appSettings.backendApiBaseUrl);
    try {
      const user = await userService.loginUser(
        this.username,
        this.password
      );
      if (this.setUserCallback) this.setUserCallback(user);
    } catch (err) {
      if (err instanceof Error) {
        this.errorMsg = err.message || "Login failed.";
      } else {
        this.errorMsg = "Login failed unexpectedly."
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
.card .card-img-left {
  background-color: #6610f2;
  background-image: url("../assets/bg-bubbles-indigo-inverse.svg");
}
</style>

<template>
  <div class="card flex-grow-1">
    <div class="row g-0">
      <div class="col-sm-4">
        <div class="card-img-left text-white p-3 d-flex flex-column justify-content-center">
          <p class="card-text text-center">Don't have an account?</p>
          <button class="btn btn-outline-light" @click="registerCallback">
            Create a new account
          </button>
        </div>
      </div>
      <div class="col-sm-8">
        <form class="card-body">
          <h3 class="card-title">Login to your account</h3>
          <transition name="fade">
            <p class="text-danger" v-if="errorMsg">{{ errorMsg }}</p>
          </transition>
          <div class="mb-3">
            <label class="form-label" for="username">Username</label>
            <input class="form-control" type="text" name="username" v-model="username" />
          </div>
          <div class="mb-3">
            <label class="form-label" for="password">Password</label>
            <input class="form-control" type="password" name="password" v-model="password" />
          </div>
          <button type="submit" class="btn btn-primary" style="width:7em"
                  :disabled="!isValidInput && !submitPending" @click.prevent="tryLogin">
            <b-spinner v-if="submitPending" label="Loading" variant="light" small />
            <span v-if="!submitPending">Login</span>
          </button>
          <button class="btn btn-link" @click.prevent="passwordResetCallback">Forgot your password?</button>
        </form>
      </div>
    </div>
  </div>
</template>
