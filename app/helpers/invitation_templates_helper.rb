# frozen_string_literal: true

module InvitationTemplatesHelper
  def invitation_template_select_options(company, template = nil)
    grouped_options_for_select(
      %w[custom default].map do |group|
        options = company.invitation_templates.send(group).map do |template|
          html_attrs = { data: { path: edit_company_invitation_template_path(company, template) } }
          [template.name, template.id, html_attrs]
        end
        [group.capitalize, options]
      end.to_h,
      template&.id
    )
  end
end
