namespace :temp do

  desc "temp stuff"

  task cta: :environment do

    # OutboundAction -> CallToAction
    OutboundAction.all.each do |action|
      if action.type == 'OutboundLink'
        type = 'CTALink'
      elsif action.type == 'OutboundForm'
        type = 'CTAForm'
      else
        puts "No type: #{action}"
      end
      new_cta = action.attributes.reject { |attribute| attribute == 'id' }
      new_cta['type'] = type
      CallToAction.create(new_cta)
    end

    # OutboundActionsStory.all.each do |entry|
    #   success_id = Story.find(entry.story_id).success.id
    #   action = OutboundAction.find(entry.outbound_action_id)
    #   type = 'CTALink' if action.type = 'OutboundLink'
    #   type = 'CTAForm' if action.type = 'OutboundForm'
    #   cta_id = CallToAction.where({ company_id: action.company_id,
    #                                 description: action.description,
    #                                 type: action.type }).take
    #   binding.remote_pry if cta_id.nil?
    #   CtasSuccess.create({
    #     call_to_action_id: cta_id,
    #     success_id: success_id
    #   })
    # end

    CtaButton.all.each do |button|
      CallToAction.create({
        company_primary: true,
        type: 'CTALink',
        company_id: button.company_id,
        link_url: button.url,
        display_text: button.btn_text
      })
      button.company.update({
        primary_cta_background_color: button.background_color,
        primary_cta_text_color: button.color
      })
    end

  end

end
