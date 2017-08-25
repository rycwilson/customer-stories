class CreateCrowdsourcingTemplates < ActiveRecord::Migration
  def change
    create_table :crowdsourcing_templates do |t|
      t.references :company, index: true, foreign_key: true
      t.string :name
      t.string :request_subject
      t.string :request_body

      t.timestamps null: false
    end
  end
end
