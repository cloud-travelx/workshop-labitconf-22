import yaml


def parse_params(args, sc_param=None):
    """
    Decodes external template parameters and overwrites the default values.
    """
    if sc_param is None:
        sc_param = {}
    try:
        param = yaml.safe_load(args)
        for key, value in param.items():
            sc_param[key] = value
        return sc_param
    except yaml.YAMLError as exc:
        print("CAN'T LOAD CUSTOM TEMPLATE PARAMETERS")
        raise exc
