class CreateJoinTableContributorPromptInvitationTemplate < ActiveRecord::Migration[6.1]
  def change
    create_join_table :contributor_prompts, :invitation_templates do |t|
      t.index [:contributor_prompt_id, :invitation_template_id], name: 'index_cp_it_on_cp_id_and_it_id'
      t.index [:invitation_template_id, :contributor_prompt_id], name: 'index_cp_it_on_it_id_and_cp_id'
    end
  end
end
