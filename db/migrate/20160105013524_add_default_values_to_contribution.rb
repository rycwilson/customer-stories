class AddDefaultValuesToContribution < ActiveRecord::Migration

  def change

    change_column :contributions, :linkedin, :boolean, default: false
    change_column :contributions, :opt_out, :boolean, default: false

  end

end
