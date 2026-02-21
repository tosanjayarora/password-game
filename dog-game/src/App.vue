<script lang="ts">
import './styles/site.scss'

import { Component, Vue } from "vue-property-decorator";
import PhishedComponent from "./components/PhishedComponent.vue";
import AuthenticationComponent from "./components/AuthenticationComponent.vue";
import { User } from "@pwdgame/shared";

@Component({
  components: {
    AuthenticationComponent,
    PhishedComponent,
  },
})
export default class App extends Vue {
  user: User | null = null;
  showAuth = true; // Flag to show AuthenticationComponent

  setUser(user: User) {
    this.user = user;
    this.showAuth = false; // When user logs in, switch to PhishedComponent
  }

  showAuthComponent() {
    this.showAuth = true; // Switch back to AuthenticationComponent
  }
}
</script>

<template>
  <div id="app" class="container-fluid">
    <AuthenticationComponent v-if="showAuth || !user" :setUserCallback="setUser" />
    <PhishedComponent v-if="!showAuth && user" :user="user" @redirect="showAuthComponent" />
  </div>
</template>