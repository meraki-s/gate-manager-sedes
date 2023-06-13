export class UiConfig {
  public adminPanel  = {
    menu: false
  };

  constructor(role?: string) {
    // set default values
    this.init();

    switch (role) {
      case 'superuser':
        this.setSuperuserUI();
        break;

      case 'administrator':
        this.setAdministratorUI();
        break;

      case 'technician':
        this.setTechnicianUI();
        break;

      default:
        this.init();
        break;
    }
  }

  /**
   * Set the configuration objects as false
   *
   * @private
   * @memberof UiConfig
   */
  private init(): void {
    this.adminPanel = {
      menu: false,
    };
  }

  /**
   * Set the configuration objects as true for super users
   *
   * @private
   * @memberof UiConfig
   */
  private setSuperuserUI(): void {
    this.adminPanel = {
      menu: true,
    };
  }

  /**
   * Set UI configuration for administrators
   *
   * @private
   * @memberof UiConfig
   */
  private setAdministratorUI(): void {
    // admin panel
    this.adminPanel.menu = false;
  }

  /**
   * Set UI configuration for technicians
   *
   * @private
   * @memberof UiConfig
   */
  private setTechnicianUI(): void {
    // admin panel
    this.adminPanel.menu = false;
  }
}
